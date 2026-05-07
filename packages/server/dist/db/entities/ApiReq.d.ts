import { BaseEntity } from "typeorm";
import { Request, Response, NextFunction } from "express";
export declare class ApiReq extends BaseEntity {
    id: number;
    headers: JSON;
    req: JSON;
    createdAt: Date;
}
export declare function apiLoggerMiddleware(req: Request, _: Response, next: NextFunction): void;
