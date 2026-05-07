import { BaseEntity } from "typeorm";
export declare class FtcApiReq extends BaseEntity {
    url: string;
    resp: any;
    createdAt: Date;
    updatedAt: Date;
}
