// @ts-nocheck
import type { PageServerLoad } from './$types';
import { getDatabaseDriver, getFtcEventsCredentials } from '$lib/server/backend';

export const load = async () => {
	const credentials = getFtcEventsCredentials();
	const driver = getDatabaseDriver();
	const databaseReady = driver === 'sqljs' || Boolean(process.env.DATABASE_URL);

	return {
		checks: {
			database: {
				status: databaseReady ? 'ready' : 'error',
				message:
					driver === 'sqljs'
						? 'Backend is configured for SQL file mode.'
						: databaseReady
							? 'Database URL is configured.'
							: 'DATABASE_URL is not configured.',
			},
			ftcEvents: {
				username: credentials?.username ? 'set' : 'missing',
				authKey: credentials?.authKey ? 'set' : 'missing',
				baseUrl: credentials?.baseUrl ?? 'https://ftc-api.firstinspires.org/v2.0',
			},
		},
		checkedAt: new Date().toISOString(),
		driver,
	};
};;null as any as PageServerLoad;