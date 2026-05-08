export const IS_PROD = process.env.NODE_ENV === "production";
export const IS_DEV = !IS_PROD;

// dark mode settings
export const THEME_COOKIE_NAME = "roboscoutai:theme";
export const THEME_COOKIE_AGE = 60 * 60 * 24 * 356 * 10;

// alert bar settings
export const ALERT_COOKIE_NAME = "roboscoutai:alert-dismissed";
export const ALERT_COOKIE_AGE = 60 * 60 * 24 * 7;
