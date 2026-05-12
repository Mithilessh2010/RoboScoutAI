// @ts-nocheck
import mongoose, { Schema, Document } from "mongoose";

export interface IWatchRoomMessage extends Document {
    roomId: string;
    senderParticipantId: string;
    senderName: string;
    message: string;
    createdAt: Date;
}

const watchRoomMessageSchema = new Schema<IWatchRoomMessage>(
    {
        roomId: { type: String, required: true, index: true },
        senderParticipantId: { type: String, required: true },
        senderName: { type: String, required: true },
        message: { type: String, required: true },
    },
    { timestamps: true }
);

watchRoomMessageSchema.index({ roomId: 1, createdAt: 1 });

export const WatchRoomMessage = mongoose.model<IWatchRoomMessage>("WatchRoomMessage", watchRoomMessageSchema);
