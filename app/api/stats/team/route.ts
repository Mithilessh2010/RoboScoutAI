import { NextResponse } from "next/server";
import { getTeamMatches, matches } from "@/lib/mock-data";
import { getTeamOpr } from "@/lib/stats/opr";
import { averageScore, teamRecord } from "@/lib/stats/teamMetrics";

export function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const teamNumber = Number(params.get("teamNumber"));
  const season = params.get("season") ?? undefined;
  const teamMatches = getTeamMatches(teamNumber, season);
  return NextResponse.json({
    teamNumber,
    record: teamRecord(teamMatches, teamNumber),
    averageScore: averageScore(teamMatches, teamNumber),
    opr: getTeamOpr(matches.filter((match) => !season || match.season === season), teamNumber),
  });
}
