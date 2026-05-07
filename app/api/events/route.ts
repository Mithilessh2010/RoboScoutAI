import { NextResponse } from "next/server";
import { getSeasonEvents } from "@/lib/mock-data";

export function GET(request: Request) {
  const season = new URL(request.url).searchParams.get("season") ?? undefined;
  return NextResponse.json(getSeasonEvents(season));
}
