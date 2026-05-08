import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	// Access environment variables - try import.meta.env first, then process.env
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

	try {
		const token = Buffer.from(`${username}:${authKey}`).toString('base64');
		
		const response = await fetch(`${baseUrl}/`, {
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
		} else if (response.status === 503) {
			errorMessage = 'FTC API Service Unavailable';
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
