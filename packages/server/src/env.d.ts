declare namespace NodeJS {
    export interface ProcessEnv {
        // interaction
        DATABASE_URL: string;
        FTC_API_KEY: string;
        // switches
        LOGGING: string;
        SYNC_DB: string;
        SYNC_API: string;
        CACHE_REQ: string;

        DB_TIMEOUT: string;
    }
}
