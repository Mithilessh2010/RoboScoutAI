import mongoose, { Schema, Document } from "mongoose";
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

const watchRoomSchema = new Schema<IWatchRoom>(
    {
        id: { type: String, required: true, unique: true },
        name: { type: String, required: true },
        season: { type: Number, default: null },
        eventCode: { type: String, default: null },
        hostParticipantId: { type: String, default: null },
        controlMode: { type: String, enum: ["HOST_ONLY", "EVERYONE"], required: true },
        layoutPreference: { type: String, enum: ["auto", "single", "two", "grid", "focus"], required: true },
        focusStreamId: { type: String, default: null },
        streams: { type: [Schema.Types.Mixed], default: [] },
        playbackState: { type: Schema.Types.Mixed, required: true },
        participants: { type: [Schema.Types.Mixed], default: [] },
    },
    { timestamps: true }
);

watchRoomSchema.index({ id: 1 }, { unique: true });

export const WatchRoom = mongoose.model<IWatchRoom>("WatchRoom", watchRoomSchema);
