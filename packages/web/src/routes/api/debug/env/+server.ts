import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	const env = {
		processEnv: {
			FTC_EVENTS_USERNAME: process.env.FTC_EVENTS_USERNAME ? 'SET' : 'MISSING',
			FTC_EVENTS_AUTH_KEY: process.env.FTC_EVENTS_AUTH_KEY ? 'SET' : 'MISSING',
			FTC_EVENTS_API_BASE_URL: process.env.FTC_EVENTS_API_BASE_URL ? 'SET' : 'MISSING',
			NODE_ENV: process.env.NODE_ENV,
		},
		importMetaEnv: {
			FTC_EVENTS_USERNAME: (import.meta.env as any).FTC_EVENTS_USERNAME ? 'SET' : 'MISSING',
			FTC_EVENTS_AUTH_KEY: (import.meta.env as any).FTC_EVENTS_AUTH_KEY ? 'SET' : 'MISSING',
			FTC_EVENTS_API_BASE_URL: (import.meta.env as any).FTC_EVENTS_API_BASE_URL ? 'SET' : 'MISSING',
		},
	};

	return json(env);
};
