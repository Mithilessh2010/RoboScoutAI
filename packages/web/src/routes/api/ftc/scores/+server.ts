import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const username = (import.meta.env as any).FTC_EVENTS_USERNAME || process.env.FTC_EVENTS_USERNAME;
	const authKey = (import.meta.env as any).FTC_EVENTS_AUTH_KEY || process.env.FTC_EVENTS_AUTH_KEY;
	const baseUrl = (import.meta.env as any).FTC_EVENTS_API_BASE_URL || process.env.FTC_EVENTS_API_BASE_URL || 'https://ftc-api.firstinspires.org/v2.0';

	if (!username || !authKey) {
		return json(
			{
				ok: false,
				error: {
					code: 'MISSING_CREDENTIALS',
					message: 'FTC API credentials not configured',
					status: 503,
				},
			},
			{ status: 503 }
		);
	}

	const season = url.searchParams.get('season');
	const eventCode = url.searchParams.get('eventCode');
	const tournamentLevel = url.searchParams.get('tournamentLevel');

	if (!season || !eventCode || !tournamentLevel) {
		return json(
			{
				ok: false,
				error: {
					code: 'MISSING_PARAMS',
					message: 'season, eventCode, and tournamentLevel parameters are required',
					status: 400,
				},
			},
			{ status: 400 }
		);
	}

	try {
		const token = Buffer.from(`${username}:${authKey}`).toString('base64');
		const queryParams = new URLSearchParams();
		
		if (url.searchParams.get('teamNumber')) queryParams.append('teamNumber', url.searchParams.get('teamNumber')!);
		if (url.searchParams.get('matchNumber')) queryParams.append('matchNumber', url.searchParams.get('matchNumber')!);
		if (url.searchParams.get('start')) queryParams.append('start', url.searchParams.get('start')!);
		if (url.searchParams.get('end')) queryParams.append('end', url.searchParams.get('end')!);

		const apiUrl = `${baseUrl}/${season}/scores/${eventCode}/${tournamentLevel}${queryParams.toString() ? '?' + queryParams : ''}`;
		const response = await fetch(apiUrl, {
			headers: {
				'Authorization': `Basic ${token}`,
				'Accept': 'application/json',
			},
		});

		if (response.status === 200) {
			const data = await response.json();
			return json({ ok: true, data });
		}

		let errorMessage = `FTC API Error ${response.status}`;
		if (response.status === 401) {
			errorMessage = 'Unauthorized: FTC API credentials are invalid';
		}

		return json(
			{
				ok: false,
				error: {
					code: 'API_ERROR',
					message: errorMessage,
					status: response.status,
				},
			},
			{ status: response.status }
		);
	} catch (error: any) {
		return json(
			{
				ok: false,
				error: {
					code: 'API_ERROR',
					message: error.message,
					status: 500,
				},
			},
			{ status: 500 }
		);
	}
};
