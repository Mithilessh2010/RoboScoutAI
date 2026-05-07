declare namespace NodeJS {
    export interface ProcessEnv {
        // interaction
        DATABASE_URL: string;
        FTC_API_KEY?: string;
        FTC_EVENTS_USERNAME?: string;
        FTC_EVENTS_AUTH_KEY?: string;
        FTC_EVENTS_API_BASE_URL?: string;
        PORT: string;

        // switches
        LOGGING: string;
        SYNC_DB: string;
        SYNC_API: string;
        CACHE_REQ: string;
        FTC_API_THROTTLE_MS?: string;
        LIVE_REFRESH_TTL_MS?: string;

        // Secrets
        FRONTEND_CODE: string;
    }
}
