import { browser } from "$app/environment";
import { createEntityId, createRoomId } from "./roomId";
import type { WatchLayout, WatchNote, WatchRoom, WatchRoomDraft, WatchStream } from "./types";

const STORAGE_PREFIX = "roboscoutai.watchRoom.";

function storageKey(roomId: string): string {
    return `${STORAGE_PREFIX}${roomId}`;
}

function now(): string {
    return new Date().toISOString();
}

export function normalizeEventCode(eventCode?: string): string | undefined {
    let normalized = eventCode?.trim().toUpperCase();
    return normalized || undefined;
}

export function createStream(title = "", url = ""): WatchStream {
    return {
        id: createEntityId("stream"),
        title: title.trim() || "Event stream",
        url: url.trim(),
    };
}

export function createRoom(draft: WatchRoomDraft): WatchRoom {
    let timestamp = now();

    let room: WatchRoom = {
        id: createRoomId(),
        name: draft.name.trim() || "RoboScoutAI Watch Room",
        layout: "two",
        streams: draft.streams.filter((stream) => stream.url.trim()),
        notes: [],
        createdAt: timestamp,
        updatedAt: timestamp,
    };

    if (draft.season !== undefined) room.season = draft.season;
    let eventCode = normalizeEventCode(draft.eventCode);
    if (eventCode) room.eventCode = eventCode;

    return room;
}

export function saveRoom(room: WatchRoom): WatchRoom {
    let nextRoom = { ...room, updatedAt: now() };
    if (browser) {
        localStorage.setItem(storageKey(nextRoom.id), JSON.stringify(nextRoom));
    }
    return nextRoom;
}

export function loadRoom(roomId: string): WatchRoom | null {
    if (!browser) return null;

    let raw = localStorage.getItem(storageKey(roomId));
    if (!raw) return null;

    try {
        return JSON.parse(raw) as WatchRoom;
    } catch {
        return null;
    }
}

export function listRooms(): WatchRoom[] {
    if (!browser) return [];

    return Object.keys(localStorage)
        .filter((key) => key.startsWith(STORAGE_PREFIX))
        .map((key) => {
            try {
                return JSON.parse(localStorage.getItem(key) || "") as WatchRoom;
            } catch {
                return null;
            }
        })
        .filter((room): room is WatchRoom => !!room)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function deleteRoom(roomId: string): void {
    if (browser) localStorage.removeItem(storageKey(roomId));
}

export function addNote(room: WatchRoom, text: string, streamId?: string): WatchRoom {
    let note: WatchNote = {
        id: createEntityId("note"),
        text: text.trim(),
        createdAt: now(),
    };

    if (streamId) note.streamId = streamId;

    return saveRoom({ ...room, notes: [note, ...room.notes] });
}

export function updateRoomLayout(room: WatchRoom, layout: WatchLayout): WatchRoom {
    return saveRoom({ ...room, layout });
}

function toInvitePayload(value: unknown): string {
    return btoa(encodeURIComponent(JSON.stringify(value)));
}

function fromInvitePayload(encoded: string): unknown {
    return JSON.parse(decodeURIComponent(atob(decodeURIComponent(encoded))));
}

export function encodeRoomState(room: WatchRoom): string {
    let inviteState = {
        name: room.name,
        season: room.season,
        eventCode: room.eventCode,
        layout: room.layout,
        streams: room.streams,
    };

    return encodeURIComponent(toInvitePayload(inviteState));
}

export function decodeRoomState(encoded: string): Partial<WatchRoom> | null {
    try {
        return fromInvitePayload(encoded) as Partial<WatchRoom>;
    } catch {
        return null;
    }
}

export function roomFromInviteState(roomId: string, state: Partial<WatchRoom>): WatchRoom {
    let timestamp = now();

    let room: WatchRoom = {
        id: roomId,
        name: state.name?.trim() || "RoboScoutAI Watch Room",
        layout: state.layout || "two",
        streams: state.streams || [],
        notes: [],
        createdAt: timestamp,
        updatedAt: timestamp,
    };

    if (state.season !== undefined) room.season = state.season;
    let eventCode = normalizeEventCode(state.eventCode);
    if (eventCode) room.eventCode = eventCode;

    return room;
}
