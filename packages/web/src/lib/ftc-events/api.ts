/**
 * FTC Events API v2.0 Endpoint Wrappers
 * High-level functions for all FTC API endpoints
 */

import { ftcEventsFetch, buildQueryString } from './client';

// API Response types
export interface ApiIndex {
	currentSeason: number;
	maxSeason: number;
}

export interface SeasonSummary {
	gameName: string;
	seasonId: number;
	seasonName: string;
	eventCount: number;
	teamCount: number;
	kickoffDate?: string;
}

export interface Team {
	teamNumber: number;
	teamName: string;
	schoolName?: string;
	city?: string;
	stateProv?: string;
	country?: string;
	robotName?: string;
	nameShort?: string;
}

export interface Event {
	code: string;
	name: string;
	type: string;
	city?: string;
	stateProv?: string;
	country?: string;
	eventCode: string;
	dateStart: string;
	dateEnd: string;
	published: boolean;
}

export interface ScheduleItem {
	matchNumber: number;
	description: string;
	tournamentLevel: string;
	startTime: string;
	matchScheduleRepeatOffsets?: number[];
	teams?: ScheduleTeam[];
}

export interface ScheduleTeam {
	teamNumber: number;
	station: string;
}

export interface HybridScheduleItem extends ScheduleItem {
	scoredPartnerTeam?: number;
}

export interface Ranking {
	teamNumber: number;
	rank: number;
	rankingPoints: number;
	wins: number;
	losses: number;
	ties: number;
	qualAverageSortOrder1?: number;
	qualAverageSortOrder2?: number;
	qualAverageSortOrder3?: number;
	qualAverageSortOrder4?: number;
	qualAverageSortOrder5?: number;
	qualAverageSortOrder6?: number;
}

export interface Match {
	matchNumber: number;
	description: string;
	tournamentLevel: string;
	series: number;
	matchScheduleRepeatOffsetMs: number;
	matchVideoURL?: string;
	teams: MatchTeam[];
	alliances: MatchAlliance[];
}

export interface MatchTeam {
	teamNumber: number;
	station: string;
	noShow?: boolean;
	surrogate?: boolean;
	onField?: boolean;
}

export interface MatchAlliance {
	color: string;
	teams: number[];
	surrogates?: number[];
}

export interface ScoreDetail {
	matchNumber: number;
	description: string;
	tournamentLevel: string;
	series: number;
	matchScheduleRepeatOffsetMs: number;
	teams: ScoreTeamDetail[];
	alliances: MatchAlliance[];
}

export interface ScoreTeamDetail extends MatchTeam {
	score: number;
	scoreBreakerPoints?: number;
}

export interface Alliance {
	number: number;
	teams: number[];
}

export interface Award {
	name: string;
	series: number;
	teamNumber?: number;
	person?: string;
	awardee?: string;
}

export interface Advancement {
	teamNumber: number;
	rank: number;
	advancementFlag: number;
}

export interface AdvancementPoints {
	teamNumber: number;
	advancementPoints: number;
	rank: number;
	rankingPoints?: number;
}

/**
 * GET /
 */
export async function getApiIndex(): Promise<ApiIndex> {
	return ftcEventsFetch('/');
}

/**
 * GET /{season}
 */
export async function getSeasonSummary(season: number): Promise<SeasonSummary> {
	return ftcEventsFetch(`/${season}`);
}

/**
 * GET /{season}/teams
 */
export interface GetTeamsParams {
	season: number;
	teamNumber?: number;
	eventCode?: string;
	state?: string;
	excludeNonCompeting?: boolean;
	page?: number;
}

export async function getTeams(params: GetTeamsParams): Promise<any> {
	const { season, teamNumber, eventCode, state, excludeNonCompeting, page } = params;

	// Validate parameter combinations
	if (teamNumber && (eventCode || state)) {
		throw new Error('Cannot use teamNumber with eventCode or state');
	}

	const queryParams = {
		teamNumber,
		eventCode,
		state,
		excludeNonCompeting,
		page,
	};

	const query = buildQueryString(queryParams);
	return ftcEventsFetch(`/${season}/teams${query}`);
}

/**
 * GET /{season}/events
 */
export interface GetEventsParams {
	season: number;
	eventCode?: string;
	teamNumber?: string;
}

export async function getEvents(params: GetEventsParams): Promise<any> {
	const { season, eventCode, teamNumber } = params;

	// Validate parameter combinations
	if (eventCode && teamNumber) {
		throw new Error('Cannot use both eventCode and teamNumber');
	}

	const queryParams = {
		eventCode,
		teamNumber,
	};

	const query = buildQueryString(queryParams);
	return ftcEventsFetch(`/${season}/events${query}`);
}

/**
 * GET /{season}/schedule/{eventCode}
 */
export interface GetScheduleParams {
	season: number;
	eventCode: string;
	tournamentLevel?: 'qual' | 'playoff';
	teamNumber?: number;
	start?: number;
	end?: number;
}

export async function getSchedule(params: GetScheduleParams): Promise<any> {
	const { season, eventCode, tournamentLevel, teamNumber, start, end } = params;

	// Validate that either tournamentLevel or teamNumber is specified
	if (!tournamentLevel && !teamNumber) {
		throw new Error('Either tournamentLevel or teamNumber must be specified');
	}

	const queryParams = {
		tournamentLevel,
		teamNumber,
		start,
		end,
	};

	const query = buildQueryString(queryParams);
	return ftcEventsFetch(`/${season}/schedule/${eventCode}${query}`);
}

/**
 * GET /{season}/schedule/{eventCode}/{tournamentLevel}/hybrid
 */
export interface GetHybridScheduleParams {
	season: number;
	eventCode: string;
	tournamentLevel: 'qual' | 'playoff';
	start?: number;
	end?: number;
}

export async function getHybridSchedule(params: GetHybridScheduleParams): Promise<any> {
	const { season, eventCode, tournamentLevel, start, end } = params;

	const queryParams = {
		start,
		end,
	};

	const query = buildQueryString(queryParams);
	return ftcEventsFetch(`/${season}/schedule/${eventCode}/${tournamentLevel}/hybrid${query}`);
}

/**
 * GET /{season}/rankings/{eventCode}
 */
export interface GetRankingsParams {
	season: number;
	eventCode: string;
	teamNumber?: number;
	top?: number;
}

export async function getRankings(params: GetRankingsParams): Promise<any> {
	const { season, eventCode, teamNumber, top } = params;

	// Validate parameter combinations
	if (top && teamNumber) {
		throw new Error('Cannot use both top and teamNumber');
	}

	const queryParams = {
		teamNumber,
		top,
	};

	const query = buildQueryString(queryParams);
	return ftcEventsFetch(`/${season}/rankings/${eventCode}${query}`);
}

/**
 * GET /{season}/matches/{eventCode}
 */
export interface GetMatchesParams {
	season: number;
	eventCode: string;
	tournamentLevel?: 'qual' | 'playoff';
	teamNumber?: number;
	matchNumber?: number;
	start?: number;
	end?: number;
}

export async function getMatches(params: GetMatchesParams): Promise<any> {
	const { season, eventCode, tournamentLevel, teamNumber, matchNumber, start, end } = params;

	// Validate parameter combinations
	if ((matchNumber || start || end) && !tournamentLevel) {
		throw new Error('tournamentLevel must be specified with matchNumber, start, or end');
	}

	if (teamNumber && matchNumber) {
		throw new Error('Cannot use both teamNumber and matchNumber');
	}

	if (matchNumber && (start || end)) {
		throw new Error('Cannot use matchNumber with start or end');
	}

	const queryParams = {
		tournamentLevel,
		teamNumber,
		matchNumber,
		start,
		end,
	};

	const query = buildQueryString(queryParams);
	return ftcEventsFetch(`/${season}/matches/${eventCode}${query}`);
}

/**
 * GET /{season}/scores/{eventCode}/{tournamentLevel}
 */
export interface GetScoreDetailsParams {
	season: number;
	eventCode: string;
	tournamentLevel: 'qual' | 'playoff';
	teamNumber?: number;
	matchNumber?: number;
	start?: number;
	end?: number;
}

export async function getScoreDetails(params: GetScoreDetailsParams): Promise<any> {
	const { season, eventCode, tournamentLevel, teamNumber, matchNumber, start, end } = params;

	const queryParams = {
		teamNumber,
		matchNumber,
		start,
		end,
	};

	const query = buildQueryString(queryParams);
	return ftcEventsFetch(`/${season}/scores/${eventCode}/${tournamentLevel}${query}`);
}

/**
 * GET /{season}/alliances/{eventCode}
 */
export interface GetAlliancesParams {
	season: number;
	eventCode: string;
}

export async function getAlliances(params: GetAlliancesParams): Promise<any> {
	const { season, eventCode } = params;
	return ftcEventsFetch(`/${season}/alliances/${eventCode}`);
}

/**
 * GET /{season}/alliances/{eventCode}/selection
 */
export interface GetAllianceSelectionParams {
	season: number;
	eventCode: string;
}

export async function getAllianceSelection(params: GetAllianceSelectionParams): Promise<any> {
	const { season, eventCode } = params;
	return ftcEventsFetch(`/${season}/alliances/${eventCode}/selection`);
}

/**
 * GET /{season}/awards/list
 */
export async function getAwardList(season: number): Promise<any> {
	return ftcEventsFetch(`/${season}/awards/list`);
}

/**
 * GET /{season}/awards/{eventCode}
 * GET /{season}/awards/{teamNumber}
 * GET /{season}/awards/{eventCode}/{teamNumber}
 */
export interface GetAwardsParams {
	season: number;
	eventCode?: string;
	teamNumber?: number;
}

export async function getAwards(params: GetAwardsParams): Promise<any> {
	const { season, eventCode, teamNumber } = params;

	let path = `/${season}/awards`;

	if (eventCode && teamNumber) {
		path += `/${eventCode}/${teamNumber}`;
	} else if (eventCode) {
		path += `/${eventCode}`;
	} else if (teamNumber) {
		path += `/${teamNumber}`;
	}

	return ftcEventsFetch(path);
}

/**
 * GET /{season}/advancement/{eventCode}
 */
export interface GetAdvancementParams {
	season: number;
	eventCode: string;
}

export async function getAdvancement(params: GetAdvancementParams): Promise<any> {
	const { season, eventCode } = params;
	return ftcEventsFetch(`/${season}/advancement/${eventCode}`);
}

/**
 * GET /{season}/advancement/{eventCode}/points
 */
export interface GetAdvancementPointsParams {
	season: number;
	eventCode: string;
}

export async function getAdvancementPoints(params: GetAdvancementPointsParams): Promise<any> {
	const { season, eventCode } = params;
	return ftcEventsFetch(`/${season}/advancement/${eventCode}/points`);
}
