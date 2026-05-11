import { g as getFtcEventsCredentials, a as getDatabaseDriver } from "../../chunks/backend.js";
const load = async () => {
  const credentials = getFtcEventsCredentials();
  const driver = getDatabaseDriver();
  const databaseReady = driver === "sqljs" || Boolean(process.env.DATABASE_URL);
  return {
    checks: {
      database: {
        status: databaseReady ? "ready" : "error",
        message: driver === "sqljs" ? "Backend is configured for SQL file mode." : databaseReady ? "Database URL is configured." : "DATABASE_URL is not configured."
      },
      ftcEvents: {
        username: credentials?.username ? "set" : "missing",
        authKey: credentials?.authKey ? "set" : "missing",
        baseUrl: credentials?.baseUrl ?? "https://ftc-api.firstinspires.org/v2.0"
      }
    },
    checkedAt: (/* @__PURE__ */ new Date()).toISOString(),
    driver
  };
};
export {
  load
};
