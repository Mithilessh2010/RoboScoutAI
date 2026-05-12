import mongoose, { Schema, Document } from "mongoose";

export interface IFtcApiReq extends Document {
    url: string;
    resp: unknown;
    createdAt: Date;
    updatedAt: Date;
}

const ftcApiReqSchema = new Schema<IFtcApiReq>(
    {
        url: { type: String, required: true, unique: true },
        resp: { type: Schema.Types.Mixed, required: true },
    },
    { timestamps: true }
);

ftcApiReqSchema.index({ url: 1 }, { unique: true });

export const FtcApiReq = mongoose.model<IFtcApiReq>("FtcApiReq", ftcApiReqSchema);
