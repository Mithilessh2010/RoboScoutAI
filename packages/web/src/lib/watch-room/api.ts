import { env } from "$env/dynamic/public";
import { browser } from "$app/environment";
import { IS_DEV } from "$lib/constants";
import type { CreateWatchRoomInput, WatchRoom, WatchRoomMessage } from "$lib/watch-room/types";

export type WatchRoomSummary = WatchRoom;

const DEFAULT_ORIGIN = "localhost:8080";

function getServerOrigin(): string {
    return env.PUBLIC_SERVER_ORIGIN || DEFAULT_ORIGIN;
}

function getScheme(): "http" | "https" {
    return IS_DEV ? "http" : "https";
}

function getWsScheme(): "ws" | "wss" {
    return IS_DEV ? "ws" : "wss";
}

export function getWatchRoomApiBase(): string {
    return `${getScheme()}://${getServerOrigin()}/rest/v1/watch`;
}

export function getWatchRoomWsUrl(roomId: string, participantId: string, displayName: string): string {
    let params = new URLSearchParams({
        roomId,
        participantId,
        displayName,
    });

    return `${getWsScheme()}://${getServerOrigin()}/watch-room?${params.toString()}`;
}

export function getWatchRoomInviteUrl(roomId: string): string {
    if (browser) {
        return `${location.origin}/watch/room/${roomId}`;
    }

    return `/watch/room/${roomId}`;
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
    let response = await fetch(`${getWatchRoomApiBase()}${path}`, {
        headers: { "content-type": "application/json", ...(init?.headers || {}) },
        ...init,
    });

    let payload = await response.json().catch(() => null);
    if (!response.ok) {
        throw new Error(payload?.error || payload?.message || `Request failed (${response.status})`);
    }

    return payload as T;
}

export function getParticipantId(): string {
    if (!browser) return "server";

    let key = "roboscoutai.watchRoom.participantId";
    let existing = localStorage.getItem(key);
    if (existing) return existing;

    let participantId = crypto.randomUUID();
    localStorage.setItem(key, participantId);
    return participantId;
}

export function getDisplayName(): string {
    if (!browser) return "Guest";

    return localStorage.getItem("roboscoutai.watchRoom.displayName") || "Guest";
}

export function setDisplayName(displayName: string): void {
    if (!browser) return;
    localStorage.setItem("roboscoutai.watchRoom.displayName", displayName.trim() || "Guest");
}

export async function listWatchRooms(): Promise<WatchRoomSummary[]> {
    return requestJson<WatchRoomSummary[]>("/rooms");
}

export async function createWatchRoom(input: CreateWatchRoomInput): Promise<WatchRoom> {
    return requestJson<WatchRoom>("/rooms", {
        method: "POST",
        body: JSON.stringify(input),
    });
}

export async function getWatchRoom(roomId: string): Promise<WatchRoom> {
    return requestJson<WatchRoom>(`/rooms/${roomId}`);
}

export async function patchWatchRoom(roomId: string, room: Partial<WatchRoom>): Promise<WatchRoom> {
    return requestJson<WatchRoom>(`/rooms/${roomId}`, {
        method: "PATCH",
        body: JSON.stringify(room),
    });
}

export async function deleteWatchRoom(roomId: string): Promise<void> {
    await requestJson<void>(`/rooms/${roomId}`, { method: "DELETE" });
}

export async function listWatchRoomMessages(roomId: string): Promise<WatchRoomMessage[]> {
    return requestJson<WatchRoomMessage[]>(`/rooms/${roomId}/messages`);
}

export async function sendWatchRoomMessage(
    roomId: string,
    input: { participantId: string; senderName: string; message: string }
): Promise<WatchRoomMessage> {
    return requestJson<WatchRoomMessage>(`/rooms/${roomId}/messages`, {
        method: "POST",
        body: JSON.stringify(input),
    });
}
