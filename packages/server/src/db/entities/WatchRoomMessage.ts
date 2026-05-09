import { BaseEntity, Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Entity()
@Index(["roomId", "createdAt"])
export class WatchRoomMessage extends BaseEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column()
    roomId!: string;

    @Column()
    senderParticipantId!: string;

    @Column()
    senderName!: string;

    @Column("text")
    message!: string;

    @CreateDateColumn({ type: "timestamptz" })
    createdAt!: Date;
}
