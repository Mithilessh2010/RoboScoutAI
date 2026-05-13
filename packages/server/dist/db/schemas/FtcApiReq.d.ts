import { Document } from "mongoose";
export interface IFtcApiReq extends Document {
    url: string;
    resp: unknown;
    createdAt: Date;
    updatedAt: Date;
}
export declare const FtcApiReq: any;
