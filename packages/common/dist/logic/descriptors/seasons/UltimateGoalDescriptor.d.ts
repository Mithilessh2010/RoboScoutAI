import { Descriptor } from "../descriptor";
export declare const WobbleEndPosition2020: {
    readonly None: "None";
    readonly StartLine: "StartLine";
    readonly DropZone: "DropZone";
};
export type WobbleEndPosition2020 = (typeof WobbleEndPosition2020)[keyof typeof WobbleEndPosition2020];
export declare function wobbleEndPosPoints(pos: WobbleEndPosition2020): number;
export declare const Descriptor2020: Descriptor;
