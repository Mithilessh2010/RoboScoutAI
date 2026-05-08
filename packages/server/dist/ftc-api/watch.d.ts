export declare const LoadType: {
    Full: string;
    Partial: string;
};
export type LoadType = (typeof LoadType)[keyof typeof LoadType];
export declare function fetchPriorSeasons(): Promise<void>;
export declare function watchApi(): Promise<void>;
