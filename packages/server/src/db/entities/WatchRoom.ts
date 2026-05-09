import { BaseEntity, Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from "typeorm";
import type { WatchControlMode, WatchLayoutPreference, WatchParticipant, WatchPlaybackState, WatchStream } from "../../watch-room/types";

@Entity()
export class WatchRoom extends BaseEntity {
    @PrimaryColumn()
    id!: string;

    @Column()
    name!: string;

    @Column({ type: "smallint", nullable: true })
    season!: number | null;

    @Column({ type: "varchar", nullable: true })
    eventCode!: string | null;

    @Column({ type: "varchar", nullable: true })
    hostParticipantId!: string | null;

    @Column({ type: "varchar", default: "HOST_ONLY" })
    controlMode!: WatchControlMode;

    @Column({ type: "varchar" })
    layoutPreference!: WatchLayoutPreference;

    @Column({ type: "varchar", nullable: true })
    focusStreamId!: string | null;

    @Column("json")
    streams!: WatchStream[];

    @Column("json")
    playbackState!: WatchPlaybackState;

    @Column("json")
    participants!: WatchParticipant[];

    @CreateDateColumn({ type: "timestamptz" })
    createdAt!: Date;

    @UpdateDateColumn({ type: "timestamptz" })
    updatedAt!: Date;
}
