import { Descriptor } from "../descriptor";
export declare const AutoSpecialScoring: {
    readonly None: "None";
    readonly NoProp: "NoProp";
    readonly TeamProp: "TeamProp";
};
export type AutoSpecialScoring = (typeof AutoSpecialScoring)[keyof typeof AutoSpecialScoring];
export declare const EgNav2023: {
    readonly None: "None";
    readonly Backstage: "Backstage";
    readonly Rigging: "Rigging";
};
export type EgNav2023 = (typeof EgNav2023)[keyof typeof EgNav2023];
export declare const Descriptor2023: Descriptor;
