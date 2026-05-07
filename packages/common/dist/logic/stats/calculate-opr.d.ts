export interface OprData {
    team1: number;
    team2: number;
    result: number;
}
export declare function calculateOpr(scores: OprData[]): Record<number, number>;
