/**
 * Client-side FTC Events API data fetching layer
 * Safely calls RoboScoutAI's own API routes (never exposes browser to FTC API)
 */

interface FtcApiResponse<T> {
	ok: boolean;
	data?: T;
	error?: {
		code: string;
		message: string;
		status: number;
	};
}

async function ftcApiCall<T>(path: string): Promise<T | null> {
	try {
		const response = await fetch(path);
		const json = (await response.json()) as FtcApiResponse<T>;

		if (!json.ok) {
			console.warn(`FTC API error: ${json.error?.message}`);
			return null;
		}

		return json.data || null;
	} catch (error) {
		console.error('FTC API call failed:', error);
		return null;
	}
}

export async function fetchFtcApiIndex() {
	return ftcApiCall('/api/ftc/index');
}

export async function fetchSeasonSummary(season: number) {
	return ftcApiCall(`/api/ftc/season/${season}`);
}

export interface FetchTeamsParams {
	season: number;
	teamNumber?: number;
	eventCode?: string;
	state?: string;
	excludeNonCompeting?: boolean;
	page?: number;
}

export async function fetchTeams(params: FetchTeamsParams) {
	const queryParams = new URLSearchParams();
	queryParams.append('season', params.season.toString());
	if (params.teamNumber) queryParams.append('teamNumber', params.teamNumber.toString());
	if (params.eventCode) queryParams.append('eventCode', params.eventCode);
	if (params.state) queryParams.append('state', params.state);
	if (params.excludeNonCompeting) queryParams.append('excludeNonCompeting', 'true');
	if (params.page) queryParams.append('page', params.page.toString());

	return ftcApiCall(`/api/ftc/teams?${queryParams}`);
}

export interface FetchEventsParams {
	season: number;
	eventCode?: string;
	teamNumber?: string;
}

export async function fetchEvents(params: FetchEventsParams) {
	const queryParams = new URLSearchParams();
	queryParams.append('season', params.season.toString());
	if (params.eventCode) queryParams.append('eventCode', params.eventCode);
	if (params.teamNumber) queryParams.append('teamNumber', params.teamNumber);

	return ftcApiCall(`/api/ftc/events?${queryParams}`);
}

export interface FetchScheduleParams {
	season: number;
	eventCode: string;
	tournamentLevel?: 'qual' | 'playoff';
	teamNumber?: number;
	start?: number;
	end?: number;
}

export async function fetchSchedule(params: FetchScheduleParams) {
	const queryParams = new URLSearchParams();
	queryParams.append('season', params.season.toString());
	queryParams.append('eventCode', params.eventCode);
	if (params.tournamentLevel) queryParams.append('tournamentLevel', params.tournamentLevel);
	if (params.teamNumber) queryParams.append('teamNumber', params.teamNumber.toString());
	if (params.start) queryParams.append('start', params.start.toString());
	if (params.end) queryParams.append('end', params.end.toString());

	return ftcApiCall(`/api/ftc/schedule?${queryParams}`);
}

export interface FetchHybridScheduleParams {
	season: number;
	eventCode: string;
	tournamentLevel: 'qual' | 'playoff';
	start?: number;
	end?: number;
}

export async function fetchHybridSchedule(params: FetchHybridScheduleParams) {
	const queryParams = new URLSearchParams();
	queryParams.append('season', params.season.toString());
	queryParams.append('eventCode', params.eventCode);
	queryParams.append('tournamentLevel', params.tournamentLevel);
	if (params.start) queryParams.append('start', params.start.toString());
	if (params.end) queryParams.append('end', params.end.toString());

	return ftcApiCall(`/api/ftc/schedule/hybrid?${queryParams}`);
}

export interface FetchRankingsParams {
	season: number;
	eventCode: string;
	teamNumber?: number;
	top?: number;
}

export async function fetchRankings(params: FetchRankingsParams) {
	const queryParams = new URLSearchParams();
	queryParams.append('season', params.season.toString());
	queryParams.append('eventCode', params.eventCode);
	if (params.teamNumber) queryParams.append('teamNumber', params.teamNumber.toString());
	if (params.top) queryParams.append('top', params.top.toString());

	return ftcApiCall(`/api/ftc/rankings?${queryParams}`);
}

export interface FetchMatchesParams {
	season: number;
	eventCode: string;
	tournamentLevel?: 'qual' | 'playoff';
	teamNumber?: number;
	matchNumber?: number;
	start?: number;
	end?: number;
}

export async function fetchMatches(params: FetchMatchesParams) {
	const queryParams = new URLSearchParams();
	queryParams.append('season', params.season.toString());
	queryParams.append('eventCode', params.eventCode);
	if (params.tournamentLevel) queryParams.append('tournamentLevel', params.tournamentLevel);
	if (params.teamNumber) queryParams.append('teamNumber', params.teamNumber.toString());
	if (params.matchNumber) queryParams.append('matchNumber', params.matchNumber.toString());
	if (params.start) queryParams.append('start', params.start.toString());
	if (params.end) queryParams.append('end', params.end.toString());

	return ftcApiCall(`/api/ftc/matches?${queryParams}`);
}

export interface FetchScoreDetailsParams {
	season: number;
	eventCode: string;
	tournamentLevel: 'qual' | 'playoff';
	teamNumber?: number;
	matchNumber?: number;
	start?: number;
	end?: number;
}

export async function fetchScoreDetails(params: FetchScoreDetailsParams) {
	const queryParams = new URLSearchParams();
	queryParams.append('season', params.season.toString());
	queryParams.append('eventCode', params.eventCode);
	queryParams.append('tournamentLevel', params.tournamentLevel);
	if (params.teamNumber) queryParams.append('teamNumber', params.teamNumber.toString());
	if (params.matchNumber) queryParams.append('matchNumber', params.matchNumber.toString());
	if (params.start) queryParams.append('start', params.start.toString());
	if (params.end) queryParams.append('end', params.end.toString());

	return ftcApiCall(`/api/ftc/scores?${queryParams}`);
}

export interface FetchAwardsParams {
	season: number;
	eventCode?: string;
	teamNumber?: number;
}

export async function fetchAwards(params: FetchAwardsParams) {
	const queryParams = new URLSearchParams();
	queryParams.append('season', params.season.toString());
	if (params.eventCode) queryParams.append('eventCode', params.eventCode);
	if (params.teamNumber) queryParams.append('teamNumber', params.teamNumber.toString());

	return ftcApiCall(`/api/ftc/awards?${queryParams}`);
}

export async function fetchAwardList(season: number) {
	const queryParams = new URLSearchParams();
	queryParams.append('season', season.toString());

	return ftcApiCall(`/api/ftc/awards/list?${queryParams}`);
}
