import { Descriptor } from "../descriptor";
export declare const AutoNav2022: {
    readonly None: "None";
    readonly Terminal: "Terminal";
    readonly Signal: "Signal";
    readonly TeamSignal: "TeamSignal";
};
export type AutoNav2022 = (typeof AutoNav2022)[keyof typeof AutoNav2022];
export declare const ConeType: {
    readonly RedCone: "RedCone";
    readonly BlueCone: "BlueCone";
    readonly RedBeacon1: "RedBeacon1";
    readonly BlueBeacon1: "BlueBeacon1";
    readonly RedBeacon2: "RedBeacon2";
    readonly BlueBeacon2: "BlueBeacon2";
};
export type ConeType = (typeof ConeType)[keyof typeof ConeType];
export declare const Descriptor2022: Descriptor;
