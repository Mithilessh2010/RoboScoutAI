/**
 * FTC Events API v2.0 Client
 * Handles HTTP Basic Authentication and API communication
 */

interface FtcApiErrorResponse {
	ok: false;
	error: {
		code: string;
		message: string;
		status: number;
	};
}

interface FtcApiSuccessResponse<T> {
	ok: true;
	data: T;
}

export type FtcApiResponse<T> = FtcApiSuccessResponse<T> | FtcApiErrorResponse;

// These will be injected by SvelteKit build time, or fall back to process.env
let credentials = {
	username: '',
	authKey: '',
	baseUrl: 'https://ftc-api.firstinspires.org/v2.0',
};

// Initialize credentials on first use
let credentialsInitialized = false;

function initializeCredentials() {
	if (credentialsInitialized) return;
	credentialsInitialized = true;

	// Try process.env first (works in server context)
	if (typeof process !== 'undefined' && process.env) {
		credentials.username = process.env.FTC_EVENTS_USERNAME || '';
		credentials.authKey = process.env.FTC_EVENTS_AUTH_KEY || '';
		credentials.baseUrl = process.env.FTC_EVENTS_API_BASE_URL || 'https://ftc-api.firstinspires.org/v2.0';
	}
}

/**
 * Check if FTC Events API credentials are available
 */
export function hasFtcEventsCredentials(): boolean {
	initializeCredentials();
	return !!(credentials.username && credentials.authKey);
}

/**
 * Fetch from FTC Events API v2.0
 * @param path - API path (e.g., "/2025/teams")
 * @param options - Additional RequestInit options
 * @returns Parsed JSON response
 * @throws Error if credentials are missing or request fails
 */
export async function ftcEventsFetch<T>(
	path: string,
	options?: RequestInit
): Promise<T> {
	initializeCredentials();

	if (!credentials.username || !credentials.authKey) {
		throw new Error(
			'FTC Events API credentials missing. Please set FTC_EVENTS_USERNAME and FTC_EVENTS_AUTH_KEY in .env.local'
		);
	}

	// Build Basic Auth header
	const token = Buffer.from(`${credentials.username}:${credentials.authKey}`).toString('base64');

	const url = new URL(path, credentials.baseUrl);
	const headers = new Headers(options?.headers || {});
	headers.set('Authorization', `Basic ${token}`);
	headers.set('Accept', 'application/json');

	const response = await fetch(url.toString(), {
		...options,
		headers,
	});

	// Handle different response codes
	if (response.status === 304) {
		// Not Modified
		return null as T;
	}

	if (response.status === 200) {
		const data = await response.json();
		return data;
	}

	// Handle error responses
	let errorMessage = `FTC API Error ${response.status}`;

	switch (response.status) {
		case 400:
			errorMessage = 'Bad Request: Invalid season or parameter';
			break;
		case 401:
			errorMessage = 'Unauthorized: FTC API credentials are invalid';
			break;
		case 404:
			errorMessage = 'Not Found: Invalid event or resource';
			break;
		case 500:
			errorMessage = 'FTC API Server Error';
			break;
		case 501:
			errorMessage = 'Not Implemented: Invalid endpoint pattern or unsupported parameters';
			break;
		case 503:
			errorMessage = 'FTC API Service Unavailable';
			break;
	}

	try {
		const errorData = await response.json();
		if (errorData.message) {
			errorMessage = errorData.message;
		}
	} catch {
		// Response wasn't JSON, use generic message
	}

	const error = new Error(errorMessage);
	(error as any).status = response.status;
	throw error;
}

/**
 * Build query string from object
 */
export function buildQueryString(params: Record<string, any> = {}): string {
	const filtered = Object.entries(params)
		.filter(([_, value]) => value !== undefined && value !== null && value !== '')
		.map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);

	return filtered.length > 0 ? '?' + filtered.join('&') : '';
}
