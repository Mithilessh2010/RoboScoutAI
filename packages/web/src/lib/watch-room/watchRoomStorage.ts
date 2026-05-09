import { browser } from "$app/environment";
import { createEntityId, createRoomId } from "./roomId";
import type { WatchLayout, WatchNote, WatchRoom, WatchRoomDraft, WatchStream } from "./types";

const STORAGE_PREFIX = "roboscoutai.watchRoom.";

type LegacyWatchRoom = WatchRoom & {
    layout: WatchLayout;
    notes: WatchNote[];
};

function storageKey(roomId: string): string {
    return `${STORAGE_PREFIX}${roomId}`;
}

function now(): string {
    return new Date().toISOString();
}

function defaultPlaybackState() {
    return {
        activeStreamId: null,
        isPlaying: false,
        currentTime: 0,
        updatedAt: now(),
        controlledBy: null,
    };
}

export function normalizeEventCode(eventCode?: string | null): string | undefined {
    let normalized = eventCode?.trim().toUpperCase();
    return normalized || undefined;
}

export function createStream(title = "", url = ""): WatchStream {
    let timestamp = now();
    return {
        id: createEntityId("stream"),
        title: title.trim() || "Event stream",
        url: url.trim(),
        embedUrl: null,
        position: 0,
        isMain: false,
        createdAt: timestamp,
        updatedAt: timestamp,
    };
}

export function createRoom(draft: WatchRoomDraft): LegacyWatchRoom {
    let timestamp = now();

    let room: LegacyWatchRoom = {
        id: createRoomId(),
        name: draft.name.trim() || "RoboScoutAI Watch Room",
        season: draft.season ?? null,
        eventCode: normalizeEventCode(draft.eventCode) ?? null,
        hostParticipantId: null,
        controlMode: "HOST_ONLY",
        layoutPreference: "auto",
        focusStreamId: null,
        streams: draft.streams.filter((stream) => stream.url.trim()),
        playbackState: defaultPlaybackState(),
        participants: [],
        createdAt: timestamp,
        updatedAt: timestamp,
        layout: "two",
        notes: [],
    };

    return room;
}

export function saveRoom(room: LegacyWatchRoom): LegacyWatchRoom {
    let nextRoom = { ...room, updatedAt: now() };
    if (browser) {
        localStorage.setItem(storageKey(nextRoom.id), JSON.stringify(nextRoom));
    }
    return nextRoom;
}

export function loadRoom(roomId: string): LegacyWatchRoom | null {
    if (!browser) return null;

    let raw = localStorage.getItem(storageKey(roomId));
    if (!raw) return null;

    try {
        return JSON.parse(raw) as LegacyWatchRoom;
    } catch {
        return null;
    }
}

export function listRooms(): LegacyWatchRoom[] {
    if (!browser) return [];

    return Object.keys(localStorage)
        .filter((key) => key.startsWith(STORAGE_PREFIX))
        .map((key) => {
            try {
                return JSON.parse(localStorage.getItem(key) || "") as LegacyWatchRoom;
            } catch {
                return null;
            }
        })
        .filter((room): room is LegacyWatchRoom => !!room)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function deleteRoom(roomId: string): void {
    if (browser) localStorage.removeItem(storageKey(roomId));
}

export function addNote(room: LegacyWatchRoom, text: string, streamId?: string): LegacyWatchRoom {
    let note: WatchNote = {
        id: createEntityId("note"),
        text: text.trim(),
        createdAt: now(),
    };

    if (streamId) note.streamId = streamId;

    return saveRoom({ ...room, notes: [note, ...room.notes] });
}

export function updateRoomLayout(room: LegacyWatchRoom, layout: WatchLayout): LegacyWatchRoom {
    return saveRoom({ ...room, layout });
}

function toInvitePayload(value: unknown): string {
    return btoa(encodeURIComponent(JSON.stringify(value)));
}

function fromInvitePayload(encoded: string): unknown {
    return JSON.parse(decodeURIComponent(atob(decodeURIComponent(encoded))));
}

export function encodeRoomState(room: LegacyWatchRoom): string {
    let inviteState = {
        name: room.name,
        season: room.season,
        eventCode: room.eventCode,
        layout: room.layout,
        streams: room.streams,
    };

    return encodeURIComponent(toInvitePayload(inviteState));
}

export function decodeRoomState(encoded: string): Partial<LegacyWatchRoom> | null {
    try {
        return fromInvitePayload(encoded) as Partial<LegacyWatchRoom>;
    } catch {
        return null;
    }
}

export function roomFromInviteState(roomId: string, state: Partial<LegacyWatchRoom>): LegacyWatchRoom {
    let timestamp = now();

    let room: LegacyWatchRoom = {
        id: roomId,
        name: state.name?.trim() || "RoboScoutAI Watch Room",
        season: state.season ?? null,
        eventCode: normalizeEventCode(state.eventCode) ?? null,
        hostParticipantId: null,
        controlMode: "HOST_ONLY",
        layoutPreference: "auto",
        focusStreamId: null,
        streams: state.streams || [],
        playbackState: defaultPlaybackState(),
        participants: [],
        createdAt: timestamp,
        updatedAt: timestamp,
        layout: state.layout || "two",
        notes: [],
    };

    return room;
}
