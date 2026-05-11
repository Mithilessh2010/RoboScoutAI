import "reflect-metadata";
import { l as loadServerEnv } from "./env.js";
let initPromise = null;
let dataSource = null;
class BackendConfigurationError extends Error {
  constructor(message) {
    super(message);
    this.name = "BackendConfigurationError";
  }
}
function getDatabaseDriver() {
  loadServerEnv();
  const configured = (process.env.DATABASE_DRIVER ?? (process.env.DATABASE_URL ? "postgres" : "sqljs")).toLowerCase();
  return configured === "sqljs" ? "sqljs" : "postgres";
}
function assertDatabaseConfig() {
  loadServerEnv();
  const driver = getDatabaseDriver();
  if (driver === "sqljs") {
    return;
  }
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    throw new BackendConfigurationError("DATABASE_URL is not configured.");
  }
  let parsed;
  try {
    parsed = new URL(databaseUrl);
  } catch {
    throw new BackendConfigurationError("DATABASE_URL must be a valid Postgres connection string.");
  }
  if (!["postgres:", "postgresql:"].includes(parsed.protocol)) {
    throw new BackendConfigurationError("DATABASE_URL must use the postgres:// or postgresql:// protocol.");
  }
  if (process.env.VERCEL && ["localhost", "127.0.0.1", "::1"].includes(parsed.hostname)) {
    throw new BackendConfigurationError("DATABASE_URL cannot point to localhost in Vercel.");
  }
}
async function getDataSource() {
  if (dataSource)
    return dataSource;
  assertDatabaseConfig();
  const dataSourceModule = await import("./data-source.js").then((n) => n.d);
  dataSource = dataSourceModule.DATA_SOURCE;
  return dataSource;
}
async function ensureBackendReady() {
  assertDatabaseConfig();
  const source = await getDataSource();
  if (source.isInitialized)
    return;
  initPromise ??= source.initialize().then(async () => {
    const dynModule = await import("./init.js");
    dynModule.initDynamicEntities();
  });
  await initPromise;
}
function getFtcEventsCredentials() {
  loadServerEnv();
  const username = process.env.FTC_EVENTS_USERNAME?.trim();
  const authKey = process.env.FTC_EVENTS_AUTH_KEY?.trim();
  const baseUrl = process.env.FTC_EVENTS_API_BASE_URL?.trim() || "https://ftc-api.firstinspires.org/v2.0";
  if (!username || !authKey) {
    return null;
  }
  return { username, authKey, baseUrl };
}
function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json" }
  });
}
export {
  BackendConfigurationError as B,
  getDatabaseDriver as a,
  ensureBackendReady as e,
  getFtcEventsCredentials as g,
  jsonResponse as j
};
