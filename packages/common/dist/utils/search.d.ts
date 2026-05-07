export interface FuzzyResult<T> {
    document: T;
    distance: number;
    highlights: number[];
}
export declare function getFuzzyDistance(haystack: string, needle: string, scoreCutoff?: number, distMatrix?: number[], pathMatrix?: number[]): FuzzyResult<string>;
export declare function calcCutoff(dist: number, needleLen?: number, needleSepChars?: number): number;
export declare function fuzzySearch<T>(documents: T[], needle: string, maxResults?: number, key?: keyof T, sort?: boolean): FuzzyResult<T>[];
export declare function highlight(str: string, highlights: number[], start?: string, end?: string): string;
