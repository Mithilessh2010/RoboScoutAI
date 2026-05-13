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
exports.toggleRoomMainStream = exports.setRoomLayout = exports.setRoomStreams = exports.setPlaybackState = exports.removeRoomParticipant = exports.upsertRoomParticipant = exports.listWatchRoomMessages = exports.addWatchRoomMessage = exports.deleteWatchRoom = exports.mutateWatchRoom = exports.saveWatchRoom = exports.createWatchRoom = exports.getWatchRoom = exports.listWatchRooms = void 0;
const crypto_1 = require("crypto");
const WatchRoom_1 = require("../db/schemas/WatchRoom");
const WatchRoomMessage_1 = require("../db/schemas/WatchRoomMessage");
function nowIso() {
    return new Date().toISOString();
}
function sanitizeName(name, fallback) {
    let cleaned = name.trim();
    return cleaned || fallback;
}
function defaultPlaybackState() {
    return {
        activeStreamId: null,
        isPlaying: false,
        currentTime: 0,
        updatedAt: nowIso(),
        controlledBy: null,
    };
}
function normalizeControlMode(controlMode) {
    return controlMode === "EVERYONE" ? "EVERYONE" : "HOST_ONLY";
}
function normalizeStreams(streams) {
    return (streams !== null && streams !== void 0 ? streams : []).map((stream, index) => {
        var _a;
        return ({
            id: stream.id || `stream-${(0, crypto_1.randomUUID)().slice(0, 8)}`,
            title: sanitizeName(stream.title, "Event stream"),
            url: stream.url.trim(),
            embedUrl: ((_a = stream.embedUrl) === null || _a === void 0 ? void 0 : _a.trim()) || null,
            position: Number.isFinite(stream.position) ? stream.position : index,
            isMain: !!stream.isMain,
            createdAt: stream.createdAt || nowIso(),
            updatedAt: stream.updatedAt || nowIso(),
        });
    });
}
function normalizeParticipants(participants) {
    return (participants !== null && participants !== void 0 ? participants : []).map((participant) => ({
        participantId: participant.participantId,
        displayName: sanitizeName(participant.displayName, "Guest"),
        joinedAt: participant.joinedAt || nowIso(),
        lastSeenAt: participant.lastSeenAt || nowIso(),
        isHost: !!participant.isHost,
    }));
}
function normalizeRoom(room) {
    var _a, _b, _c, _d;
    return {
        id: room.id,
        name: room.name,
        season: (_a = room.season) !== null && _a !== void 0 ? _a : null,
        eventCode: (_b = room.eventCode) !== null && _b !== void 0 ? _b : null,
        hostParticipantId: (_c = room.hostParticipantId) !== null && _c !== void 0 ? _c : null,
        controlMode: normalizeControlMode(room.controlMode),
        layoutPreference: room.layoutPreference || "auto",
        focusStreamId: (_d = room.focusStreamId) !== null && _d !== void 0 ? _d : null,
        streams: normalizeStreams(room.streams),
        playbackState: room.playbackState || defaultPlaybackState(),
        participants: normalizeParticipants(room.participants),
        createdAt: room.createdAt.toISOString(),
        updatedAt: room.updatedAt.toISOString(),
    };
}
function listWatchRooms() {
    return __awaiter(this, void 0, void 0, function* () {
        let rooms = yield WatchRoom_1.WatchRoom.find().sort({ updatedAt: -1 });
        return rooms.map((room) => normalizeRoom(room));
    });
}
exports.listWatchRooms = listWatchRooms;
function getWatchRoom(roomId) {
    return __awaiter(this, void 0, void 0, function* () {
        let room = yield WatchRoom_1.WatchRoom.findOne({ id: roomId });
        return room ? normalizeRoom(room) : null;
    });
}
exports.getWatchRoom = getWatchRoom;
function createWatchRoom(input) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        let timestamp = nowIso();
        let hostParticipantId = input.participantId;
        let room = WatchRoom_1.WatchRoom.create({
            id: (0, crypto_1.randomUUID)().slice(0, 8),
            name: sanitizeName(input.name, "RoboScoutAI Watch Room"),
            season: (_a = input.season) !== null && _a !== void 0 ? _a : null,
            eventCode: ((_b = input.eventCode) === null || _b === void 0 ? void 0 : _b.trim().toUpperCase()) || null,
            hostParticipantId,
            controlMode: normalizeControlMode(input.controlMode),
            layoutPreference: "auto",
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
        yield room.save();
        return normalizeRoom(room);
    });
}
exports.createWatchRoom = createWatchRoom;
function saveWatchRoom(room) {
    var _a, _b, _c, _d;
    return __awaiter(this, void 0, void 0, function* () {
        let entity = WatchRoom_1.WatchRoom.create({
            id: room.id,
            name: sanitizeName(room.name, "RoboScoutAI Watch Room"),
            season: (_a = room.season) !== null && _a !== void 0 ? _a : null,
            eventCode: (_b = room.eventCode) !== null && _b !== void 0 ? _b : null,
            hostParticipantId: (_c = room.hostParticipantId) !== null && _c !== void 0 ? _c : null,
            controlMode: normalizeControlMode(room.controlMode),
            layoutPreference: room.layoutPreference || "auto",
            focusStreamId: (_d = room.focusStreamId) !== null && _d !== void 0 ? _d : null,
            streams: normalizeStreams(room.streams),
            playbackState: room.playbackState || defaultPlaybackState(),
            participants: normalizeParticipants(room.participants),
            createdAt: new Date(room.createdAt),
            updatedAt: new Date(room.updatedAt),
        });
        yield entity.save();
        return normalizeRoom(entity);
    });
}
exports.saveWatchRoom = saveWatchRoom;
function mutateWatchRoom(roomId, updater) {
    return __awaiter(this, void 0, void 0, function* () {
        let room = yield getWatchRoom(roomId);
        if (!room)
            return null;
        return saveWatchRoom(yield updater(room));
    });
}
exports.mutateWatchRoom = mutateWatchRoom;
function deleteWatchRoom(roomId) {
    return __awaiter(this, void 0, void 0, function* () {
        yield WatchRoom_1.WatchRoom.deleteOne({ id: roomId });
        yield WatchRoomMessage_1.WatchRoomMessage.deleteMany({ roomId });
    });
}
exports.deleteWatchRoom = deleteWatchRoom;
function addWatchRoomMessage(roomId, senderParticipantId, senderName, message) {
    return __awaiter(this, void 0, void 0, function* () {
        let record = WatchRoomMessage_1.WatchRoomMessage.create({
            roomId,
            senderParticipantId,
            senderName: sanitizeName(senderName, "Guest"),
            message: message.trim(),
        });
        yield record.save();
        return {
            id: record.id,
            roomId: record.roomId,
            senderParticipantId: record.senderParticipantId,
            senderName: record.senderName,
            message: record.message,
            createdAt: record.createdAt.toISOString(),
        };
    });
}
exports.addWatchRoomMessage = addWatchRoomMessage;
function listWatchRoomMessages(roomId, limit = 50) {
    return __awaiter(this, void 0, void 0, function* () {
        let records = yield WatchRoomMessage_1.WatchRoomMessage.find({ roomId }).sort({ createdAt: 1 }).limit(limit);
        return records.map((record) => ({
            id: record.id,
            roomId: record.roomId,
            senderParticipantId: record.senderParticipantId,
            senderName: record.senderName,
            message: record.message,
            createdAt: record.createdAt.toISOString(),
        }));
    });
}
exports.listWatchRoomMessages = listWatchRoomMessages;
function upsertRoomParticipant(room, participantId, displayName) {
    let timestamp = nowIso();
    let participants = [...room.participants];
    let existing = participants.find((participant) => participant.participantId === participantId);
    if (existing) {
        existing.displayName = sanitizeName(displayName, existing.displayName);
        existing.lastSeenAt = timestamp;
    }
    else {
        participants.push({
            participantId,
            displayName: sanitizeName(displayName, "Guest"),
            joinedAt: timestamp,
            lastSeenAt: timestamp,
            isHost: room.hostParticipantId === participantId,
        });
    }
    return Object.assign(Object.assign({}, room), { participants, updatedAt: timestamp });
}
exports.upsertRoomParticipant = upsertRoomParticipant;
function removeRoomParticipant(room, participantId) {
    return Object.assign(Object.assign({}, room), { participants: room.participants.filter((participant) => participant.participantId !== participantId), updatedAt: nowIso() });
}
exports.removeRoomParticipant = removeRoomParticipant;
function setPlaybackState(room, nextState) {
    let timestamp = nowIso();
    return Object.assign(Object.assign({}, room), { playbackState: Object.assign(Object.assign(Object.assign({}, room.playbackState), nextState), { updatedAt: timestamp }), updatedAt: timestamp });
}
exports.setPlaybackState = setPlaybackState;
function setRoomStreams(room, streams) {
    return Object.assign(Object.assign({}, room), { streams: normalizeStreams(streams), updatedAt: nowIso() });
}
exports.setRoomStreams = setRoomStreams;
function setRoomLayout(room, layoutPreference, focusStreamId = null) {
    return Object.assign(Object.assign({}, room), { layoutPreference,
        focusStreamId, updatedAt: nowIso() });
}
exports.setRoomLayout = setRoomLayout;
function toggleRoomMainStream(room, streamId) {
    let timestamp = nowIso();
    return Object.assign(Object.assign({}, room), { streams: room.streams.map((stream) => (Object.assign(Object.assign({}, stream), { isMain: stream.id === streamId, updatedAt: timestamp }))), playbackState: Object.assign(Object.assign({}, room.playbackState), { activeStreamId: streamId, updatedAt: timestamp }), focusStreamId: streamId, layoutPreference: "focus", updatedAt: timestamp });
}
exports.toggleRoomMainStream = toggleRoomMainStream;
//# sourceMappingURL=store.js.map