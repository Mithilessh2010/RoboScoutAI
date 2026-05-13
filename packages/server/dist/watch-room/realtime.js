"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupWatchRoomRealtime = void 0;
const ws_1 = require("ws");
const store_1 = require("./store");
const rooms = new Map();
function send(socket, event) {
    if (socket.readyState === 1) {
        socket.send(JSON.stringify(event));
    }
}
function broadcast(roomId, event) {
    var _a;
    for (let client of (_a = rooms.get(roomId)) !== null && _a !== void 0 ? _a : []) {
        send(client.socket, event);
    }
}
function canControlPlayback(room, participantId) {
    if (room.controlMode === "EVERYONE")
        return true;
    if (!room.hostParticipantId)
        return true;
    return room.hostParticipantId === participantId;
}
function persistAndBroadcast(roomId, updater) {
    return __awaiter(this, void 0, void 0, function* () {
        let room = yield (0, store_1.getWatchRoom)(roomId);
        if (!room)
            return null;
        let nextRoom = yield updater(room);
        let savedRoom = yield (0, store_1.saveWatchRoom)(nextRoom);
        broadcast(roomId, { type: "room:update", payload: { room: savedRoom } });
        broadcast(roomId, { type: "room:participants", payload: { roomId, participants: savedRoom.participants } });
        return savedRoom;
    });
}
function setupWatchRoomRealtime() {
    let wsServer = new ws_1.WebSocketServer({ noServer: true });
    wsServer.on("connection", (socket, request) => __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d;
        let url = new URL((_a = request.url) !== null && _a !== void 0 ? _a : "/watch-room", "http://localhost");
        let roomId = (_b = url.searchParams.get("roomId")) !== null && _b !== void 0 ? _b : "";
        let participantId = (_c = url.searchParams.get("participantId")) !== null && _c !== void 0 ? _c : "";
        let displayName = (_d = url.searchParams.get("displayName")) !== null && _d !== void 0 ? _d : "Guest";
        if (!roomId || !participantId) {
            send(socket, { type: "room:error", payload: { message: "Missing roomId or participantId." } });
            socket.close();
            return;
        }
        let room = yield (0, store_1.getWatchRoom)(roomId);
        if (!room) {
            send(socket, { type: "room:error", payload: { message: "Room not found." } });
            socket.close();
            return;
        }
        let joinedRoom = yield persistAndBroadcast(roomId, (current) => (0, store_1.upsertRoomParticipant)(current, participantId, displayName));
        if (!joinedRoom) {
            socket.close();
            return;
        }
        let client = { socket, roomId, participantId };
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
                messages: yield (0, store_1.listWatchRoomMessages)(roomId),
                participantId,
            },
        });
        socket.on("message", (raw) => __awaiter(this, void 0, void 0, function* () {
            let event;
            try {
                event = JSON.parse(raw.toString());
            }
            catch (_e) {
                send(socket, { type: "room:error", payload: { message: "Invalid room event." } });
                return;
            }
            let current = yield (0, store_1.getWatchRoom)(roomId);
            if (!current)
                return;
            switch (event.type) {
                case "room:leave": {
                    yield persistAndBroadcast(roomId, (room) => (0, store_1.removeRoomParticipant)(room, participantId));
                    break;
                }
                case "participant:update": {
                    let payload = event.payload;
                    yield persistAndBroadcast(roomId, (room) => (0, store_1.upsertRoomParticipant)(room, participantId, payload.displayName));
                    break;
                }
                case "stream:add": {
                    let payload = event.payload;
                    yield persistAndBroadcast(roomId, (room) => (0, store_1.setRoomStreams)(room, [...room.streams, payload.stream]));
                    break;
                }
                case "stream:update": {
                    let payload = event.payload;
                    yield persistAndBroadcast(roomId, (room) => (0, store_1.setRoomStreams)(room, room.streams.map((stream) => stream.id === payload.streamId
                        ? Object.assign(Object.assign(Object.assign({}, stream), payload.patch), { updatedAt: new Date().toISOString() }) : stream)));
                    break;
                }
                case "stream:remove": {
                    let payload = event.payload;
                    yield persistAndBroadcast(roomId, (room) => {
                        var _a, _b;
                        let streams = room.streams.filter((stream) => stream.id !== payload.streamId);
                        let next = (0, store_1.setRoomStreams)(room, streams);
                        if (next.playbackState.activeStreamId === payload.streamId) {
                            next.playbackState.activeStreamId = (_b = (_a = streams[0]) === null || _a === void 0 ? void 0 : _a.id) !== null && _b !== void 0 ? _b : null;
                        }
                        return next;
                    });
                    break;
                }
                case "stream:main": {
                    if (!canControlPlayback(current, participantId))
                        return;
                    let payload = event.payload;
                    yield persistAndBroadcast(roomId, (room) => (Object.assign(Object.assign({}, room), { streams: room.streams.map((stream) => (Object.assign(Object.assign({}, stream), { isMain: stream.id === payload.streamId, updatedAt: new Date().toISOString() }))), playbackState: Object.assign(Object.assign({}, room.playbackState), { activeStreamId: payload.streamId, updatedAt: new Date().toISOString(), controlledBy: participantId }), focusStreamId: payload.streamId, layoutPreference: "focus" })));
                    break;
                }
                case "layout:update": {
                    let payload = event.payload;
                    yield persistAndBroadcast(roomId, (room) => {
                        var _a;
                        return (Object.assign(Object.assign({}, room), { layoutPreference: payload.layoutPreference, focusStreamId: (_a = payload.focusStreamId) !== null && _a !== void 0 ? _a : null }));
                    });
                    break;
                }
                case "playback:play":
                case "playback:pause":
                case "playback:seek":
                case "playback:sync": {
                    if (!canControlPlayback(current, participantId))
                        return;
                    let payload = event.payload;
                    yield persistAndBroadcast(roomId, (room) => (0, store_1.setPlaybackState)(room, {
                        activeStreamId: payload.streamId,
                        isPlaying: event.type === "playback:pause" ? false : event.type === "playback:play" || !!payload.isPlaying,
                        currentTime: payload.currentTime,
                        controlledBy: participantId,
                    }));
                    break;
                }
                case "chat:message": {
                    let payload = event.payload;
                    let message = payload.message.trim();
                    if (!message)
                        return;
                    let created = yield (0, store_1.addWatchRoomMessage)(roomId, participantId, payload.senderName, message);
                    broadcast(roomId, { type: "room:message", payload: { message: created } });
                    break;
                }
            }
        }));
        socket.on("close", () => __awaiter(this, void 0, void 0, function* () {
            var _f, _g, _h;
            (_f = rooms.get(roomId)) === null || _f === void 0 ? void 0 : _f.delete(client);
            if (((_h = (_g = rooms.get(roomId)) === null || _g === void 0 ? void 0 : _g.size) !== null && _h !== void 0 ? _h : 0) <= 0)
                rooms.delete(roomId);
            let next = yield persistAndBroadcast(roomId, (room) => (0, store_1.removeRoomParticipant)(room, participantId));
            if (next) {
                broadcast(roomId, { type: "room:participants", payload: { roomId, participants: next.participants } });
            }
        }));
    }));
    return wsServer;
}
exports.setupWatchRoomRealtime = setupWatchRoomRealtime;
//# sourceMappingURL=realtime.js.map