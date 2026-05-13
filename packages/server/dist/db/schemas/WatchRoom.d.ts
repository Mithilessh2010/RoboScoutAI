import mongoose, { Document } from "mongoose";
import type { WatchControlMode, WatchLayoutPreference, WatchParticipant, WatchPlaybackState, WatchStream } from "../../watch-room/types";
export interface IWatchRoom extends Document {
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
export declare const WatchRoom: mongoose.Model<IWatchRoom, {}, {}, {}, mongoose.Document<unknown, {}, IWatchRoom, {}, {}> & IWatchRoom & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
