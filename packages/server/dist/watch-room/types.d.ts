export type WatchLayoutPreference = "auto" | "single" | "two" | "grid" | "focus";
export type WatchControlMode = "HOST_ONLY" | "EVERYONE";
export type WatchStream = {
    id: string;
    title: string;
    url: string;
    embedUrl: string | null;
    position: number;
    isMain: boolean;
    createdAt: string;
    updatedAt: string;
};
export type WatchPlaybackState = {
    activeStreamId: string | null;
    isPlaying: boolean;
    currentTime: number;
    updatedAt: string;
    controlledBy: string | null;
};
export type WatchParticipant = {
    participantId: string;
    displayName: string;
    joinedAt: string;
    lastSeenAt: string;
    isHost: boolean;
};
export type WatchRoom = {
    id: string;
    name: string;
    season: number | null;
    eventCode: string | null;
    hostParticipantId: string | null;
    controlMode: WatchControlMode;
    layoutPreference: WatchLayoutPreference;
    focusStreamId: string | null;
    streams: WatchStream[];
    playbackState: WatchPlaybackState;
    participants: WatchParticipant[];
    createdAt: string;
    updatedAt: string;
};
export type WatchRoomMessage = {
    id: string;
    roomId: string;
    senderParticipantId: string;
    senderName: string;
    message: string;
    createdAt: string;
};
export type CreateWatchRoomInput = {
    name: string;
    season?: number | null;
    eventCode?: string | null;
    participantId: string;
    displayName: string;
    controlMode?: WatchControlMode;
};
export type WatchRoomSummary = WatchRoom;
