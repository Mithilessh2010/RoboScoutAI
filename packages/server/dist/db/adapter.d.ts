export declare const DBAdapter: {
    findTeamByNumber(number: number): Promise<any>;
    findTeamsByNumbers(numbers: number[]): Promise<any>;
    findAllTeams(): Promise<any>;
    upsertTeam(data: any): Promise<any>;
    findEventBySeasonAndCode(season: number, code: string): Promise<any>;
    findEventsBySeason(season: number): Promise<any>;
    findEventsBySeasonAndCodes(season: number, codes: string[]): Promise<any>;
    upsertEvent(data: any): Promise<any>;
    findMatchesByEvent(season: number, eventCode: string): Promise<any>;
    findMatchByEventAndId(season: number, eventCode: string, id: number): Promise<any>;
    upsertMatch(data: any): Promise<any>;
    findAwardsByEvent(season: number, eventCode: string): Promise<any>;
    findAwardsByTeam(number: number, season?: number): Promise<any>;
    upsertAward(data: any): Promise<any>;
    findTeamParticipationInMatch(season: number, eventCode: string, matchId: number, teamNumber: number): Promise<any>;
    findTeamParticipationsInMatch(season: number, eventCode: string, matchId: number): Promise<any>;
    upsertTeamParticipation(data: any): Promise<any>;
};
