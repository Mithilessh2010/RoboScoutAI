import { BaseEntity } from "typeorm";
export declare class Analytics extends BaseEntity {
    id: number;
    url: string;
    fromUrl: string | null;
    pathChanged: boolean;
    sessionId: string;
    userId: string;
    browser: string;
    deviceType: string;
    date: Date;
}
