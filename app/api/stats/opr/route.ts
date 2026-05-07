import { NextResponse } from "next/server";
import { matches } from "@/lib/mock-data";
import { calculateOpr } from "@/lib/stats/opr";

export function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const season = params.get("season");
  const eventCode = params.get("eventCode");
  const scope = matches.filter((match) => (!season || match.season === season) && (!eventCode || match.eventCode === eventCode));
  return NextResponse.json(calculateOpr(scope));
}
