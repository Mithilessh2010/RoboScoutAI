import { NextResponse } from "next/server";
import { hasFtcEventsCredentials } from "@/lib/ftc-events/client";
import { getApiIndex, getAwards, getEvents, getMatches, getRankings, getTeams } from "@/lib/ftc-events/api";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const scope = body.scope ?? "seasons";
  if (!hasFtcEventsCredentials()) {
    return NextResponse.json(
      {
        status: "skipped",
        warning: "FTC Events API credentials are not configured. Add FTC_EVENTS_USERNAME and FTC_EVENTS_AUTH_KEY server-side to enable live sync.",
      },
      { status: 200 },
    );
  }

  const season = Number(body.season ?? new Date().getFullYear());
  const eventCode = body.eventCode;
  const result =
    scope === "seasons"
      ? await getApiIndex()
      : scope === "teams"
        ? await getTeams({ season, eventCode })
        : scope === "events"
          ? await getEvents({ season })
          : scope === "matches"
            ? await getMatches({ season, eventCode, tournamentLevel: "qual" })
            : scope === "rankings"
              ? await getRankings({ season, eventCode })
              : scope === "awards"
                ? await getAwards({ season, eventCode })
                : undefined;

  return NextResponse.json({ status: "success", data: result });
}
