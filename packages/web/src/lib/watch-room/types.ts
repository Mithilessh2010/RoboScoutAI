export type WatchLayout = "single" | "two" | "four";

export interface WatchStream {
    id: string;
    title: string;
    url: string;
}

export interface WatchNote {
    id: string;
    text: string;
    createdAt: string;
    streamId?: string;
}

export interface WatchRoom {
    id: string;
    name: string;
    season?: number;
    eventCode?: string;
    layout: WatchLayout;
    streams: WatchStream[];
    notes: WatchNote[];
    createdAt: string;
    updatedAt: string;
}

export interface WatchRoomDraft {
    name: string;
    season?: number;
    eventCode?: string;
    streams: WatchStream[];
}
