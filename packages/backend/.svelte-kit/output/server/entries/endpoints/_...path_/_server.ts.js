import { createHash } from "node:crypto";
import { graphql } from "graphql";
import { S as Season } from "../../../chunks/Season.js";
import { e as ensureBackendReady, B as BackendConfigurationError, g as getFtcEventsCredentials, j as jsonResponse } from "../../../chunks/backend.js";
function notFound(message = "Not Found", status = 404) {
  return new Response(message, { status });
}
function methodNotAllowed(allow) {
  return new Response("Method Not Allowed", {
    status: 405,
    headers: { allow: allow.join(", ") }
  });
}
function parseVariables(value) {
  if (!value)
    return void 0;
  if (typeof value === "string")
    return JSON.parse(value);
  return value;
}
async function executeGraphQL(body) {
  if (!body.query) {
    return jsonResponse({ errors: [{ message: "PersistedQueryNotFound" }] });
  }
  await ensureBackendReady();
  const schemaModule = await import("../../../chunks/schema.js");
  const args = {
    schema: schemaModule.GQL_SCHEMA,
    source: body.query,
    variableValues: parseVariables(body.variables),
    operationName: body.operationName
  };
  return jsonResponse(await graphql(args));
}
function errorResponse(error) {
  if (error instanceof BackendConfigurationError) {
    return jsonResponse(
      { errors: [{ message: error.message, extensions: { code: "DATABASE_UNAVAILABLE" } }] },
      503
    );
  }
  return jsonResponse(
    {
      errors: [
        {
          message: error instanceof Error ? error.message : "Invalid GraphQL request."
        }
      ]
    },
    400
  );
}
async function handleGraphQL(event) {
  if (event.request.method === "GET") {
    try {
      return await executeGraphQL({
        query: event.url.searchParams.get("query") ?? void 0,
        operationName: event.url.searchParams.get("operationName") ?? void 0,
        variables: event.url.searchParams.get("variables"),
        extensions: event.url.searchParams.get("extensions")
      });
    } catch (error) {
      return errorResponse(error);
    }
  }
  if (event.request.method === "POST") {
    try {
      return await executeGraphQL(await event.request.json());
    } catch (error) {
      return errorResponse(error);
    }
  }
  return methodNotAllowed(["GET", "POST"]);
}
async function handleAnalytics(event) {
  if (event.request.method !== "POST") {
    return methodNotAllowed(["POST"]);
  }
  try {
    const parsed = await event.request.json();
    const url = parsed.url;
    const fromUrl = parsed.from;
    const sessionId = parsed.sessionId;
    const pathChanged = !!parsed.pathChanged;
    const time = +parsed.time;
    if (!url || !time || !sessionId || typeof url !== "string" || fromUrl != null && typeof fromUrl !== "string" || typeof sessionId !== "string" || Number.isNaN(time)) {
      return new Response(null, { status: 204 });
    }
    const uaString = event.request.headers.get("user-agent");
    if (!uaString)
      return new Response(null, { status: 204 });
    const browser = uaString.includes("Firefox/") ? "Firefox" : uaString.includes("Edg/") ? "Edge" : uaString.includes("Chrome/") ? "Chrome" : uaString.includes("Safari/") ? "Safari" : "Unknown";
    const device = /Mobile|Android|iPhone|iPad/i.test(uaString) ? "mobile" : "desktop";
    try {
      await ensureBackendReady();
    } catch (error) {
      if (error instanceof BackendConfigurationError) {
        return new Response(null, { status: 204 });
      }
      throw error;
    }
    const analyticsModule = await import("../../../chunks/Analytics.js");
    const Analytics = analyticsModule.Analytics;
    const forwardedFor = event.request.headers.get("x-forwarded-for");
    const ip = forwardedFor ?? event.getClientAddress();
    const userId = createHash("md5").update("ftcscout" + uaString + ip).digest("hex");
    await Analytics.create({
      url,
      fromUrl,
      pathChanged,
      sessionId,
      userId,
      browser,
      deviceType: device,
      date: new Date(time)
    }).save();
  } catch {
  }
  return new Response(null, { status: 204 });
}
async function handleSitemap(event) {
  try {
    await ensureBackendReady();
  } catch (error) {
    if (error instanceof BackendConfigurationError) {
      return new Response("Database unavailable", { status: 503 });
    }
    throw error;
  }
  const eventModule = await import("../../../chunks/Event.js").then((n) => n.n);
  const teamModule = await import("../../../chunks/Team.js").then((n) => n.b);
  const Event = eventModule.Event;
  const Team = teamModule.Team;
  const origin = event.url.origin;
  const events = await Event.find({ select: { season: true, code: true } });
  const teams = await Team.find({ select: { number: true } });
  const staticPaths = ["/", "/teams", "/events", "/records", "/opr", "/watch", "/about"];
  const urls = [
    ...staticPaths.map((path) => `${origin}${path}`),
    ...Object.values(Season).filter((season) => typeof season === "number").map((season) => `${origin}/events/${season}`),
    ...events.map((item) => `${origin}/events/${item.season}/${item.code}`),
    ...teams.map((team) => `${origin}/teams/${team.number}`)
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((loc) => `  <url><loc>${loc}</loc></url>`).join("\n")}
</urlset>
`;
  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml"
    }
  });
}
function getFtcApiUrl(baseUrl, path, params) {
  return `${baseUrl}${path}${params && params.toString() ? `?${params}` : ""}`;
}
async function proxyFtcApi(apiUrl) {
  const credentials = getFtcEventsCredentials();
  if (!credentials) {
    return jsonResponse(
      {
        ok: false,
        error: {
          code: "MISSING_CREDENTIALS",
          message: "FTC API credentials not configured",
          status: 503
        }
      },
      503
    );
  }
  const token = Buffer.from(`${credentials.username}:${credentials.authKey}`).toString("base64");
  const response = await fetch(apiUrl, {
    headers: {
      Authorization: `Basic ${token}`,
      Accept: "application/json"
    }
  });
  if (response.status === 200) {
    const data = await response.json();
    return jsonResponse({ ok: true, data });
  }
  let errorMessage = `FTC API Error ${response.status}`;
  if (response.status === 401) {
    errorMessage = "Unauthorized: FTC API credentials are invalid";
  } else if (response.status === 503) {
    errorMessage = "FTC API Service Unavailable";
  }
  return jsonResponse(
    {
      ok: false,
      error: {
        code: "API_ERROR",
        message: errorMessage,
        status: response.status
      }
    },
    response.status
  );
}
async function handleFtc(event, segments) {
  const credentials = getFtcEventsCredentials();
  if (!credentials) {
    return jsonResponse(
      {
        ok: false,
        error: {
          code: "MISSING_CREDENTIALS",
          message: "FTC API credentials not configured",
          status: 503
        }
      },
      503
    );
  }
  const season = event.url.searchParams.get("season");
  const eventCode = event.url.searchParams.get("eventCode");
  const tournamentLevel = event.url.searchParams.get("tournamentLevel");
  const ftcRoot = segments.slice(2).join("/");
  if (ftcRoot === "index") {
    return proxyFtcApi(getFtcApiUrl(credentials.baseUrl, "/"));
  }
  if (ftcRoot === "season") {
    const seasonSegment = segments[3];
    if (!seasonSegment) {
      return jsonResponse(
        {
          ok: false,
          error: {
            code: "INVALID_SEASON",
            message: "Season must be provided in the path",
            status: 400
          }
        },
        400
      );
    }
    return proxyFtcApi(getFtcApiUrl(credentials.baseUrl, `/${seasonSegment}`));
  }
  if (ftcRoot === "events") {
    if (!season) {
      return jsonResponse(
        {
          ok: false,
          error: {
            code: "MISSING_SEASON",
            message: "season parameter is required",
            status: 400
          }
        },
        400
      );
    }
    const queryParams = new URLSearchParams();
    if (event.url.searchParams.get("eventCode"))
      queryParams.append("eventCode", event.url.searchParams.get("eventCode"));
    if (event.url.searchParams.get("teamNumber"))
      queryParams.append("teamNumber", event.url.searchParams.get("teamNumber"));
    return proxyFtcApi(getFtcApiUrl(credentials.baseUrl, `/${season}/events`, queryParams));
  }
  if (ftcRoot === "teams") {
    if (!season) {
      return jsonResponse(
        {
          ok: false,
          error: {
            code: "MISSING_SEASON",
            message: "season parameter is required",
            status: 400
          }
        },
        400
      );
    }
    const queryParams = new URLSearchParams();
    for (const key of ["teamNumber", "eventCode", "state", "excludeNonCompeting", "page"]) {
      const value = event.url.searchParams.get(key);
      if (value)
        queryParams.append(key, value);
    }
    return proxyFtcApi(getFtcApiUrl(credentials.baseUrl, `/${season}/teams`, queryParams));
  }
  if (ftcRoot === "matches") {
    if (!season || !eventCode) {
      return jsonResponse(
        {
          ok: false,
          error: {
            code: "MISSING_PARAMS",
            message: "season and eventCode parameters are required",
            status: 400
          }
        },
        400
      );
    }
    const queryParams = new URLSearchParams();
    for (const key of ["tournamentLevel", "teamNumber", "matchNumber", "start", "end"]) {
      const value = event.url.searchParams.get(key);
      if (value)
        queryParams.append(key, value);
    }
    return proxyFtcApi(getFtcApiUrl(credentials.baseUrl, `/${season}/matches/${eventCode}`, queryParams));
  }
  if (ftcRoot === "rankings") {
    if (!season || !eventCode) {
      return jsonResponse(
        {
          ok: false,
          error: {
            code: "MISSING_PARAMS",
            message: "season and eventCode parameters are required",
            status: 400
          }
        },
        400
      );
    }
    const queryParams = new URLSearchParams();
    for (const key of ["teamNumber", "top"]) {
      const value = event.url.searchParams.get(key);
      if (value)
        queryParams.append(key, value);
    }
    return proxyFtcApi(getFtcApiUrl(credentials.baseUrl, `/${season}/rankings/${eventCode}`, queryParams));
  }
  if (ftcRoot === "alliances") {
    if (!season || !eventCode) {
      return jsonResponse(
        {
          ok: false,
          error: {
            code: "MISSING_PARAMS",
            message: "season and eventCode parameters are required",
            status: 400
          }
        },
        400
      );
    }
    return proxyFtcApi(getFtcApiUrl(credentials.baseUrl, `/${season}/alliances/${eventCode}`));
  }
  if (ftcRoot === "alliance-selection") {
    if (!season || !eventCode) {
      return jsonResponse(
        {
          ok: false,
          error: {
            code: "MISSING_PARAMS",
            message: "season and eventCode parameters are required",
            status: 400
          }
        },
        400
      );
    }
    return proxyFtcApi(getFtcApiUrl(credentials.baseUrl, `/${season}/alliances/${eventCode}/selection`));
  }
  if (ftcRoot === "awards/list") {
    if (!season) {
      return jsonResponse(
        {
          ok: false,
          error: {
            code: "MISSING_SEASON",
            message: "season parameter is required",
            status: 400
          }
        },
        400
      );
    }
    return proxyFtcApi(getFtcApiUrl(credentials.baseUrl, `/${season}/awards/list`));
  }
  if (ftcRoot === "awards") {
    if (!season) {
      return jsonResponse(
        {
          ok: false,
          error: {
            code: "MISSING_SEASON",
            message: "season parameter is required",
            status: 400
          }
        },
        400
      );
    }
    const eventCodeParam = event.url.searchParams.get("eventCode");
    const teamNumberParam = event.url.searchParams.get("teamNumber");
    let path = `/${season}/awards`;
    if (eventCodeParam && teamNumberParam) {
      path += `/${eventCodeParam}/${teamNumberParam}`;
    } else if (eventCodeParam) {
      path += `/${eventCodeParam}`;
    } else if (teamNumberParam) {
      path += `/${teamNumberParam}`;
    }
    return proxyFtcApi(getFtcApiUrl(credentials.baseUrl, path));
  }
  if (ftcRoot === "scores") {
    if (!season || !eventCode || !tournamentLevel) {
      return jsonResponse(
        {
          ok: false,
          error: {
            code: "MISSING_PARAMS",
            message: "season, eventCode, and tournamentLevel parameters are required",
            status: 400
          }
        },
        400
      );
    }
    const queryParams = new URLSearchParams();
    for (const key of ["teamNumber", "matchNumber", "start", "end"]) {
      const value = event.url.searchParams.get(key);
      if (value)
        queryParams.append(key, value);
    }
    return proxyFtcApi(getFtcApiUrl(credentials.baseUrl, `/${season}/scores/${eventCode}/${tournamentLevel}`, queryParams));
  }
  if (ftcRoot === "schedule/hybrid") {
    if (!season || !eventCode || !tournamentLevel) {
      return jsonResponse(
        {
          ok: false,
          error: {
            code: "MISSING_PARAMS",
            message: "season, eventCode, and tournamentLevel parameters are required",
            status: 400
          }
        },
        400
      );
    }
    const queryParams = new URLSearchParams();
    for (const key of ["teamNumber", "start", "end"]) {
      const value = event.url.searchParams.get(key);
      if (value)
        queryParams.append(key, value);
    }
    return proxyFtcApi(getFtcApiUrl(credentials.baseUrl, `/${season}/schedule/${eventCode}/${tournamentLevel}/hybrid`, queryParams));
  }
  if (ftcRoot === "schedule") {
    if (!season || !eventCode) {
      return jsonResponse(
        {
          ok: false,
          error: {
            code: "MISSING_PARAMS",
            message: "season and eventCode parameters are required",
            status: 400
          }
        },
        400
      );
    }
    const queryParams = new URLSearchParams();
    for (const key of ["tournamentLevel", "teamNumber", "start", "end"]) {
      const value = event.url.searchParams.get(key);
      if (value)
        queryParams.append(key, value);
    }
    return proxyFtcApi(getFtcApiUrl(credentials.baseUrl, `/${season}/schedule/${eventCode}`, queryParams));
  }
  if (ftcRoot === "advancement") {
    if (!season || !eventCode) {
      return jsonResponse(
        {
          ok: false,
          error: {
            code: "MISSING_PARAMS",
            message: "season and eventCode parameters are required",
            status: 400
          }
        },
        400
      );
    }
    return proxyFtcApi(getFtcApiUrl(credentials.baseUrl, `/${season}/advancement/${eventCode}`));
  }
  if (ftcRoot === "index") {
    return proxyFtcApi(getFtcApiUrl(credentials.baseUrl, "/"));
  }
  return notFound();
}
async function handleDebugEnv() {
  const credentials = getFtcEventsCredentials();
  const databaseDriver = (process.env.DATABASE_DRIVER ?? (process.env.DATABASE_URL ? "postgres" : "sqljs")).toLowerCase();
  const effectiveDriver = databaseDriver === "sqljs" ? "sqljs" : "postgres";
  return jsonResponse({
    processEnv: {
      DATABASE_DRIVER: effectiveDriver,
      DATABASE_URL: process.env.DATABASE_URL ? "SET" : "MISSING",
      SQLJS_LOCATION: process.env.SQLJS_LOCATION ? "SET" : "MISSING",
      FTC_EVENTS_USERNAME: process.env.FTC_EVENTS_USERNAME ? "SET" : "MISSING",
      FTC_EVENTS_AUTH_KEY: process.env.FTC_EVENTS_AUTH_KEY ? "SET" : "MISSING",
      FTC_EVENTS_API_BASE_URL: process.env.FTC_EVENTS_API_BASE_URL ? "SET" : "MISSING",
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL ? "SET" : "MISSING"
    },
    database: {
      driver: effectiveDriver,
      persistence: effectiveDriver === "sqljs" && process.env.VERCEL ? "ephemeral" : "persistent"
    },
    ftcEvents: {
      username: credentials?.username ? "set" : "missing",
      authKey: credentials?.authKey ? "set" : "missing",
      baseUrl: credentials?.baseUrl ?? "https://ftc-api.firstinspires.org/v2.0"
    }
  });
}
async function handleAutoscore(segments) {
  if (segments[3] && segments[4] === "analyze") {
    return jsonResponse(
      {
        status: "not_implemented",
        message: "Autoscore analysis is reserved for the backend project scaffold."
      },
      501
    );
  }
  if (segments[3] && segments[4] === "result") {
    return jsonResponse(
      {
        status: "not_implemented",
        message: "Autoscore results are reserved for the backend project scaffold."
      },
      501
    );
  }
  return jsonResponse(
    {
      status: "not_implemented",
      message: "Autoscore jobs are reserved for the backend project scaffold. Persistent job storage is not implemented yet."
    },
    501
  );
}
async function handleWatch(segments) {
  if (segments[2] === "realtime") {
    return jsonResponse(
      {
        error: "Watch realtime WebSocket support is not part of the backend project scaffold. Use the frontend project for local browser-only watch UI."
      },
      410
    );
  }
  return jsonResponse(
    {
      error: "Watch backend routes are disabled in the separate backend project scaffold."
    },
    410
  );
}
async function dispatchBackendRequest(event) {
  const pathname = event.url.pathname.replace(/\/+$/, "") || "/";
  const segments = pathname.split("/").filter(Boolean);
  if (pathname === "/graphql") {
    return handleGraphQL(event);
  }
  if (pathname === "/analytics") {
    return handleAnalytics(event);
  }
  if (pathname === "/sitemap.xml") {
    return handleSitemap(event);
  }
  if (segments[0] === "api") {
    if (segments[1] === "debug" && segments[2] === "env") {
      return event.request.method === "GET" ? handleDebugEnv() : methodNotAllowed(["GET"]);
    }
    if (segments[1] === "autoscore") {
      return handleAutoscore(segments);
    }
    if (segments[1] === "watch") {
      return handleWatch(segments);
    }
    if (segments[1] === "ftc") {
      if (event.request.method !== "GET") {
        return methodNotAllowed(["GET"]);
      }
      return handleFtc(event, segments);
    }
  }
  return notFound();
}
const GET = async (event) => dispatchBackendRequest(event);
const POST = async (event) => dispatchBackendRequest(event);
const PUT = async (event) => dispatchBackendRequest(event);
const PATCH = async (event) => dispatchBackendRequest(event);
const DELETE = async (event) => dispatchBackendRequest(event);
const OPTIONS = async (event) => dispatchBackendRequest(event);
export {
  DELETE,
  GET,
  OPTIONS,
  PATCH,
  POST,
  PUT
};
