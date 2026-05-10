import { BaseEntity, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class ApiReq extends BaseEntity {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column("json")
    headers!: JSON;

    @Column("json")
    req!: JSON;

    @CreateDateColumn({ type: "timestamptz" })
    createdAt!: Date;
}
