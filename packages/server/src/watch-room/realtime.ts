import { WebSocketServer, type WebSocket } from "ws";
import type { WatchRoom } from "./types";
import {
    addWatchRoomMessage,
    getWatchRoom,
    listWatchRoomMessages,
    removeRoomParticipant,
    saveWatchRoom,
    setPlaybackState,
    setRoomStreams,
    upsertRoomParticipant,
} from "./store";

type ClientRecord = { socket: WebSocket; roomId: string; participantId: string };

type RoomEvent =
    | { type: "room:join"; payload: { roomId: string; participantId: string; displayName: string } }
    | { type: "room:leave"; payload: { roomId: string; participantId: string } }
    | { type: "participant:update"; payload: { roomId: string; participantId: string; displayName: string } }
    | { type: "stream:add"; payload: { roomId: string; participantId: string; stream: WatchRoom["streams"][number] } }
    | { type: "stream:update"; payload: { roomId: string; participantId: string; streamId: string; patch: Partial<WatchRoom["streams"][number]> } }
    | { type: "stream:remove"; payload: { roomId: string; participantId: string; streamId: string } }
    | { type: "stream:main"; payload: { roomId: string; participantId: string; streamId: string } }
    | { type: "layout:update"; payload: { roomId: string; participantId: string; layoutPreference: WatchRoom["layoutPreference"]; focusStreamId?: string | null } }
    | { type: "playback:play"; payload: { roomId: string; participantId: string; streamId: string; currentTime: number } }
    | { type: "playback:pause"; payload: { roomId: string; participantId: string; streamId: string; currentTime: number } }
    | { type: "playback:seek"; payload: { roomId: string; participantId: string; streamId: string; currentTime: number } }
    | { type: "playback:sync"; payload: { roomId: string; participantId: string; streamId: string; currentTime: number; isPlaying: boolean } }
    | { type: "chat:message"; payload: { roomId: string; participantId: string; senderName: string; message: string } };

type ServerEvent =
    | { type: "room:init"; payload: { room: WatchRoom; messages: Awaited<ReturnType<typeof listWatchRoomMessages>>; participantId: string } }
    | { type: "room:update"; payload: { room: WatchRoom } }
    | { type: "room:participants"; payload: { roomId: string; participants: WatchRoom["participants"] } }
    | { type: "room:message"; payload: { message: Awaited<ReturnType<typeof addWatchRoomMessage>> } }
    | { type: "room:error"; payload: { message: string } };

const rooms = new Map<string, Set<ClientRecord>>();

function send(socket: WebSocket, event: ServerEvent): void {
    if (socket.readyState === 1) {
        socket.send(JSON.stringify(event));
    }
}

function broadcast(roomId: string, event: ServerEvent): void {
    for (let client of rooms.get(roomId) ?? []) {
        send(client.socket, event);
    }
}

function canControlPlayback(room: WatchRoom, participantId: string): boolean {
    if (room.controlMode === "EVERYONE") return true;
    if (!room.hostParticipantId) return true;
    return room.hostParticipantId === participantId;
}

async function persistAndBroadcast(roomId: string, updater: (room: WatchRoom) => WatchRoom | Promise<WatchRoom>): Promise<WatchRoom | null> {
    let room = await getWatchRoom(roomId);
    if (!room) return null;

    let nextRoom = await updater(room);
    let savedRoom = await saveWatchRoom(nextRoom);
    broadcast(roomId, { type: "room:update", payload: { room: savedRoom } });
    broadcast(roomId, { type: "room:participants", payload: { roomId, participants: savedRoom.participants } });
    return savedRoom;
}

export function setupWatchRoomRealtime(): WebSocketServer {
    let wsServer = new WebSocketServer({ noServer: true });

    wsServer.on("connection", async (socket, request) => {
        let url = new URL(request.url ?? "/watch-room", "http://localhost");
        let roomId = url.searchParams.get("roomId") ?? "";
        let participantId = url.searchParams.get("participantId") ?? "";
        let displayName = url.searchParams.get("displayName") ?? "Guest";

        if (!roomId || !participantId) {
            send(socket, { type: "room:error", payload: { message: "Missing roomId or participantId." } });
            socket.close();
            return;
        }

        let room = await getWatchRoom(roomId);
        if (!room) {
            send(socket, { type: "room:error", payload: { message: "Room not found." } });
            socket.close();
            return;
        }

        let joinedRoom = await persistAndBroadcast(roomId, (current) => upsertRoomParticipant(current, participantId, displayName));
        if (!joinedRoom) {
            socket.close();
            return;
        }

        let client: ClientRecord = { socket, roomId, participantId };
        let clientSet = rooms.get(roomId);
        if (!clientSet) {
            clientSet = new Set();
            rooms.set(roomId, clientSet);
        }
        clientSet.add(client);

        send(socket, {
            type: "room:init",
            payload: {
                room: joinedRoom,
                messages: await listWatchRoomMessages(roomId),
                participantId,
            },
        });

        socket.on("message", async (raw) => {
            let event: RoomEvent;

            try {
                event = JSON.parse(raw.toString()) as RoomEvent;
            } catch {
                send(socket, { type: "room:error", payload: { message: "Invalid room event." } });
                return;
            }

            let current = await getWatchRoom(roomId);
            if (!current) return;

            switch (event.type) {
                case "room:leave": {
                    await persistAndBroadcast(roomId, (room) => removeRoomParticipant(room, participantId));
                    break;
                }
                case "participant:update": {
                    let payload = event.payload as { displayName: string };
                    await persistAndBroadcast(roomId, (room) => upsertRoomParticipant(room, participantId, payload.displayName));
                    break;
                }
                case "stream:add": {
                    let payload = event.payload as { stream: WatchRoom["streams"][number] };
                    await persistAndBroadcast(roomId, (room) => setRoomStreams(room, [...room.streams, payload.stream]));
                    break;
                }
                case "stream:update": {
                    let payload = event.payload as { streamId: string; patch: Partial<WatchRoom["streams"][number]> };
                    await persistAndBroadcast(roomId, (room) =>
                        setRoomStreams(
                            room,
                            room.streams.map((stream) =>
                                stream.id === payload.streamId
                                    ? { ...stream, ...payload.patch, updatedAt: new Date().toISOString() }
                                    : stream
                            )
                        )
                    );
                    break;
                }
                case "stream:remove": {
                    let payload = event.payload as { streamId: string };
                    await persistAndBroadcast(roomId, (room) => {
                        let streams = room.streams.filter((stream) => stream.id !== payload.streamId);
                        let next = setRoomStreams(room, streams);
                        if (next.playbackState.activeStreamId === payload.streamId) {
                            next.playbackState.activeStreamId = streams[0]?.id ?? null;
                        }
                        return next;
                    });
                    break;
                }
                case "stream:main": {
                    if (!canControlPlayback(current, participantId)) return;
                    let payload = event.payload as { streamId: string };
                    await persistAndBroadcast(roomId, (room) => ({
                        ...room,
                        streams: room.streams.map((stream) => ({
                            ...stream,
                            isMain: stream.id === payload.streamId,
                            updatedAt: new Date().toISOString(),
                        })),
                        playbackState: { ...room.playbackState, activeStreamId: payload.streamId, updatedAt: new Date().toISOString(), controlledBy: participantId },
                        focusStreamId: payload.streamId,
                        layoutPreference: "focus",
                    }));
                    break;
                }
                case "layout:update": {
                    let payload = event.payload as { layoutPreference: WatchRoom["layoutPreference"]; focusStreamId?: string | null };
                    await persistAndBroadcast(roomId, (room) => ({
                        ...room,
                        layoutPreference: payload.layoutPreference,
                        focusStreamId: payload.focusStreamId ?? null,
                    }));
                    break;
                }
                case "playback:play":
                case "playback:pause":
                case "playback:seek":
                case "playback:sync": {
                    if (!canControlPlayback(current, participantId)) return;
                    let payload = event.payload as { streamId: string; currentTime: number; isPlaying?: boolean };
                    await persistAndBroadcast(roomId, (room) =>
                        setPlaybackState(room, {
                            activeStreamId: payload.streamId,
                            isPlaying: event.type === "playback:pause" ? false : event.type === "playback:play" || !!payload.isPlaying,
                            currentTime: payload.currentTime,
                            controlledBy: participantId,
                        })
                    );
                    break;
                }
                case "chat:message": {
                    let payload = event.payload as { senderName: string; message: string };
                    let message = payload.message.trim();
                    if (!message) return;

                    let created = await addWatchRoomMessage(roomId, participantId, payload.senderName, message);
                    broadcast(roomId, { type: "room:message", payload: { message: created } });
                    break;
                }
            }
        });

        socket.on("close", async () => {
            rooms.get(roomId)?.delete(client);
            if ((rooms.get(roomId)?.size ?? 0) <= 0) rooms.delete(roomId);

            let next = await persistAndBroadcast(roomId, (room) => removeRoomParticipant(room, participantId));
            if (next) {
                broadcast(roomId, { type: "room:participants", payload: { roomId, participants: next.participants } });
            }
        });
    });

    return wsServer;
}
