import { NextResponse } from "next/server";
import { getSeasonTeams } from "@/lib/mock-data";

export function GET(request: Request) {
  const season = new URL(request.url).searchParams.get("season") ?? undefined;
  return NextResponse.json(getSeasonTeams(season));
}
