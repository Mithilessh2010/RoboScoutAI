import { BaseEntity } from "typeorm";
export declare class ApiReq extends BaseEntity {
    id: number;
    headers: JSON;
    req: JSON;
    createdAt: Date;
}
