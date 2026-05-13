import { Document } from "mongoose";
export interface IAnalytics extends Document {
    url: string;
    fromUrl?: string | null;
    pathChanged: boolean;
    sessionId: string;
    userId: string;
    browser: string;
    deviceType: string;
    date: Date;
}
export declare const Analytics: any;
export interface IApiReq extends Document {
    headers: Record<string, any>;
    req: Record<string, any>;
    createdAt: Date;
}
export declare const ApiReq: any;
