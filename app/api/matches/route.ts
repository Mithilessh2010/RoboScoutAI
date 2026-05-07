import { NextResponse } from "next/server";
import { matches } from "@/lib/mock-data";

export function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const season = params.get("season");
  const eventCode = params.get("eventCode");
  return NextResponse.json(matches.filter((match) => (!season || match.season === season) && (!eventCode || match.eventCode === eventCode)));
}
