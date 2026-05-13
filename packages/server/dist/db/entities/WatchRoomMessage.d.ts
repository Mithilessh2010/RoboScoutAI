import { BaseEntity } from "typeorm";
export declare class WatchRoomMessage extends BaseEntity {
    id: string;
    roomId: string;
    senderParticipantId: string;
    senderName: string;
    message: string;
    createdAt: Date;
}
