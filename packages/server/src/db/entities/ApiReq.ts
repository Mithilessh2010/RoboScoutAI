import { BaseEntity, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";
import { Request, Response, NextFunction } from "express";

const FRONTEND_REQUEST_HEADER = "x-roboscoutai-frontend";

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

// Log uses of our api that aren't the frontend.
export function apiLoggerMiddleware(req: Request, _: Response, next: NextFunction) {
    if (!(FRONTEND_REQUEST_HEADER in req.headers) && req.body?.["operationName"] != "IntrospectionQuery") {
        ApiReq.save({ req: req.body, headers: req.rawHeaders as any });
    }
    next();
}
