import { Document } from "mongoose";
export interface IWatchRoomMessage extends Document {
    roomId: string;
    senderParticipantId: string;
    senderName: string;
    message: string;
    createdAt: Date;
}
export declare const WatchRoomMessage: any;
