import { Season } from "../Season";
import { StatSet } from "./stat-table";
export declare const TepStatGroup: {
    readonly Tot: "tot";
    readonly Avg: "avg";
    readonly Opr: "opr";
    readonly Min: "min";
    readonly Max: "max";
    readonly Dev: "dev";
};
export type TepStatGroup = (typeof TepStatGroup)[keyof typeof TepStatGroup];
export declare const TEP_STAT_GROUPS: ("tot" | "avg" | "opr" | "min" | "max" | "dev")[];
export declare const TEP_GROUP_COLORS: {
    tot: "red";
    avg: "purple";
    opr: "purple";
    min: "light-blue";
    max: "blue";
    dev: "green";
};
export declare const TEP_GROUP_DATA_TYS: {
    tot: "int";
    avg: "float";
    opr: "float";
    min: "int";
    max: "int";
    dev: "float";
};
export declare const TEP_GROUP_NAMES: {
    tot: string[];
    avg: string[];
    opr: string[];
    min: string[];
    max: string[];
    dev: string[];
};
export declare const TEP_GROUP_DESC: {
    tot: string;
    avg: string;
    opr: string;
    min: string;
    max: string;
    dev: string;
};
export declare function getTepStatSet(season: Season, remote: boolean): StatSet<any>;
