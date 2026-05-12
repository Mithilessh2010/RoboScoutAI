import mongoose, { Schema, Document } from "mongoose";

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

const analyticsSchema = new Schema<IAnalytics>(
    {
        url: { type: String, required: true, index: true },
        fromUrl: { type: String, index: true, default: null },
        pathChanged: { type: Boolean, required: true, index: true },
        sessionId: { type: String, required: true, index: true },
        userId: { type: String, required: true, index: true },
        browser: { type: String, required: true, index: true },
        deviceType: { type: String, required: true, index: true },
        date: { type: Date, required: true, index: true },
    },
    { timestamps: false }
);

export const Analytics = mongoose.model<IAnalytics>("Analytics", analyticsSchema);

export interface IApiReq extends Document {
    headers: Record<string, any>;
    req: Record<string, any>;
    createdAt: Date;
}

const apiReqSchema = new Schema<IApiReq>(
    {
        headers: { type: Schema.Types.Mixed, required: true },
        req: { type: Schema.Types.Mixed, required: true },
    },
    { timestamps: true }
);

export const ApiReq = mongoose.model<IApiReq>("ApiReq", apiReqSchema);
