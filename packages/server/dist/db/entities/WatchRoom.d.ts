import { BaseEntity } from "typeorm";
import type { WatchControlMode, WatchLayoutPreference, WatchParticipant, WatchPlaybackState, WatchStream } from "../../watch-room/types";
export declare class WatchRoom extends BaseEntity {
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
    createdAt: Date;
    updatedAt: Date;
}
