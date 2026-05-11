import { env } from "$env/dynamic/public";

const DEFAULT_DEV_ORIGIN = "localhost:4000";
const DEFAULT_PROD_ORIGIN = "api.ftcscout.org";

export function getServerOrigin(): string {
    return env.PUBLIC_SERVER_ORIGIN || (import.meta.env.DEV ? DEFAULT_DEV_ORIGIN : DEFAULT_PROD_ORIGIN);
}