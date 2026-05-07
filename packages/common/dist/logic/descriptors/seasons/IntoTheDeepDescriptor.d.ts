import { Descriptor } from "../descriptor";
export declare const ITDPark: {
    readonly ObservationZone: "ObservationZone";
    readonly Ascent1: "Ascent1";
    readonly Ascent2: "Ascent2";
    readonly Ascent3: "Ascent3";
    readonly None: "None";
};
export type ITDPark = (typeof ITDPark)[keyof typeof ITDPark];
export declare const Descriptor2024: Descriptor;
