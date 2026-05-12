import { randomUUID } from "crypto";
import { WatchRoom as WatchRoomEntity } from "../db/schemas/WatchRoom";
import { WatchRoomMessage as WatchRoomMessageEntity } from "../db/schemas/WatchRoomMessage";
import type {
    CreateWatchRoomInput,
    WatchControlMode,
    WatchLayoutPreference,
    WatchParticipant,
    WatchPlaybackState,
    WatchRoom,
    WatchRoomMessage,
    WatchRoomSummary,
    WatchStream,
} from "./types";

function nowIso(): string {
    return new Date().toISOString();
}

function sanitizeName(name: string, fallback: string): string {
    let cleaned = name.trim();
    return cleaned || fallback;
}

function defaultPlaybackState(): WatchPlaybackState {
    return {
        activeStreamId: null,
        isPlaying: false,
        currentTime: 0,
        updatedAt: nowIso(),
        controlledBy: null,
    };
}

function normalizeControlMode(controlMode: WatchControlMode | null | undefined): WatchControlMode {
    return controlMode === "EVERYONE" ? "EVERYONE" : "HOST_ONLY";
}

function normalizeStreams(streams: WatchStream[] | null | undefined): WatchStream[] {
    return (streams ?? []).map((stream, index) => ({
        id: stream.id || `stream-${randomUUID().slice(0, 8)}`,
        title: sanitizeName(stream.title, "Event stream"),
        url: stream.url.trim(),
        embedUrl: stream.embedUrl?.trim() || null,
        position: Number.isFinite(stream.position) ? stream.position : index,
        isMain: !!stream.isMain,
        createdAt: stream.createdAt || nowIso(),
        updatedAt: stream.updatedAt || nowIso(),
    }));
}

function normalizeParticipants(participants: WatchParticipant[] | null | undefined): WatchParticipant[] {
    return (participants ?? []).map((participant) => ({
        participantId: participant.participantId,
        displayName: sanitizeName(participant.displayName, "Guest"),
        joinedAt: participant.joinedAt || nowIso(),
        lastSeenAt: participant.lastSeenAt || nowIso(),
        isHost: !!participant.isHost,
    }));
}

function normalizeRoom(room: WatchRoomEntity): WatchRoom {
    return {
        id: room.id,
        name: room.name,
        season: room.season ?? null,
        eventCode: room.eventCode ?? null,
        hostParticipantId: room.hostParticipantId ?? null,
        controlMode: normalizeControlMode(room.controlMode),
        layoutPreference: room.layoutPreference || "auto",
        focusStreamId: room.focusStreamId ?? null,
        streams: normalizeStreams(room.streams),
        playbackState: room.playbackState || defaultPlaybackState(),
        participants: normalizeParticipants(room.participants),
        createdAt: room.createdAt.toISOString(),
        updatedAt: room.updatedAt.toISOString(),
    };
}

export async function listWatchRooms(): Promise<WatchRoomSummary[]> {
    let rooms = await WatchRoomEntity.find().sort({ updatedAt: -1 });
    return rooms.map((room) => normalizeRoom(room));
}

export async function getWatchRoom(roomId: string): Promise<WatchRoom | null> {
    let room = await WatchRoomEntity.findOne({ id: roomId });
    return room ? normalizeRoom(room) : null;
}

export async function createWatchRoom(input: CreateWatchRoomInput): Promise<WatchRoom> {
    let timestamp = nowIso();
    let hostParticipantId = input.participantId;

    let room = WatchRoomEntity.create({
        id: randomUUID().slice(0, 8),
        name: sanitizeName(input.name, "RoboScoutAI Watch Room"),
        season: input.season ?? null,
        eventCode: input.eventCode?.trim().toUpperCase() || null,
        hostParticipantId,
        controlMode: normalizeControlMode(input.controlMode),
        layoutPreference: "auto" satisfies WatchLayoutPreference,
        focusStreamId: null,
        streams: [],
        playbackState: defaultPlaybackState(),
        participants: [
            {
                participantId: hostParticipantId,
                displayName: sanitizeName(input.displayName, "Host"),
                joinedAt: timestamp,
                lastSeenAt: timestamp,
                isHost: true,
            },
        ],
    });

    await room.save();
    return normalizeRoom(room);
}

export async function saveWatchRoom(room: WatchRoom): Promise<WatchRoom> {
    let entity = WatchRoomEntity.create({
        id: room.id,
        name: sanitizeName(room.name, "RoboScoutAI Watch Room"),
        season: room.season ?? null,
        eventCode: room.eventCode ?? null,
        hostParticipantId: room.hostParticipantId ?? null,
        controlMode: normalizeControlMode(room.controlMode),
        layoutPreference: room.layoutPreference || "auto",
        focusStreamId: room.focusStreamId ?? null,
        streams: normalizeStreams(room.streams),
        playbackState: room.playbackState || defaultPlaybackState(),
        participants: normalizeParticipants(room.participants),
        createdAt: new Date(room.createdAt),
        updatedAt: new Date(room.updatedAt),
    });

    await entity.save();
    return normalizeRoom(entity);
}

export async function mutateWatchRoom(roomId: string, updater: (room: WatchRoom) => WatchRoom | Promise<WatchRoom>): Promise<WatchRoom | null> {
    let room = await getWatchRoom(roomId);
    if (!room) return null;

    return saveWatchRoom(await updater(room));
}

export async function deleteWatchRoom(roomId: string): Promise<void> {
    await WatchRoomEntity.deleteOne({ id: roomId });
    await WatchRoomMessageEntity.deleteMany({ roomId });
}

export async function addWatchRoomMessage(roomId: string, senderParticipantId: string, senderName: string, message: string): Promise<WatchRoomMessage> {
    let record = WatchRoomMessageEntity.create({
        roomId,
        senderParticipantId,
        senderName: sanitizeName(senderName, "Guest"),
        message: message.trim(),
    });

    await record.save();

    return {
        id: record.id,
        roomId: record.roomId,
        senderParticipantId: record.senderParticipantId,
        senderName: record.senderName,
        message: record.message,
        createdAt: record.createdAt.toISOString(),
    };
}

export async function listWatchRoomMessages(roomId: string, limit = 50): Promise<WatchRoomMessage[]> {
    let records = await WatchRoomMessageEntity.find({ roomId }).sort({ createdAt: 1 }).limit(limit);

    return records.map((record) => ({
        id: record.id,
        roomId: record.roomId,
        senderParticipantId: record.senderParticipantId,
        senderName: record.senderName,
        message: record.message,
        createdAt: record.createdAt.toISOString(),
    }));
}

export function upsertRoomParticipant(room: WatchRoom, participantId: string, displayName: string): WatchRoom {
    let timestamp = nowIso();
    let participants = [...room.participants];
    let existing = participants.find((participant) => participant.participantId === participantId);

    if (existing) {
        existing.displayName = sanitizeName(displayName, existing.displayName);
        existing.lastSeenAt = timestamp;
    } else {
        participants.push({
            participantId,
            displayName: sanitizeName(displayName, "Guest"),
            joinedAt: timestamp,
            lastSeenAt: timestamp,
            isHost: room.hostParticipantId === participantId,
        });
    }

    return { ...room, participants, updatedAt: timestamp };
}

export function removeRoomParticipant(room: WatchRoom, participantId: string): WatchRoom {
    return {
        ...room,
        participants: room.participants.filter((participant) => participant.participantId !== participantId),
        updatedAt: nowIso(),
    };
}

export function setPlaybackState(room: WatchRoom, nextState: Partial<WatchPlaybackState>): WatchRoom {
    let timestamp = nowIso();
    return {
        ...room,
        playbackState: {
            ...room.playbackState,
            ...nextState,
            updatedAt: timestamp,
        },
        updatedAt: timestamp,
    };
}

export function setRoomStreams(room: WatchRoom, streams: WatchStream[]): WatchRoom {
    return {
        ...room,
        streams: normalizeStreams(streams),
        updatedAt: nowIso(),
    };
}

export function setRoomLayout(room: WatchRoom, layoutPreference: WatchLayoutPreference, focusStreamId: string | null = null): WatchRoom {
    return {
        ...room,
        layoutPreference,
        focusStreamId,
        updatedAt: nowIso(),
    };
}

export function toggleRoomMainStream(room: WatchRoom, streamId: string): WatchRoom {
    let timestamp = nowIso();
    return {
        ...room,
        streams: room.streams.map((stream) => ({
            ...stream,
            isMain: stream.id === streamId,
            updatedAt: timestamp,
        })),
        playbackState: {
            ...room.playbackState,
            activeStreamId: streamId,
            updatedAt: timestamp,
        },
        focusStreamId: streamId,
        layoutPreference: "focus",
        updatedAt: timestamp,
    };
}
