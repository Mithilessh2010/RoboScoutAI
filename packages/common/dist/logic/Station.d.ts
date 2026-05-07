export declare const Station: {
    readonly One: "One";
    readonly Two: "Two";
    readonly NotOnField: "NotOnField";
    readonly Solo: "Solo";
};
export type Station = (typeof Station)[keyof typeof Station];
