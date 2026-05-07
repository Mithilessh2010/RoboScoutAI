import { getMatches } from "@/lib/ftc-events/api";
import { ftcRoute, num, requiredNum, requiredString } from "@/lib/ftc-events/route-utils";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  return ftcRoute(() =>
    getMatches({
      season: requiredNum(params, "season"),
      eventCode: requiredString(params, "eventCode"),
      tournamentLevel: (params.get("tournamentLevel") ?? undefined) as "qual" | "playoff" | undefined,
      teamNumber: num(params, "teamNumber"),
      matchNumber: num(params, "matchNumber"),
      start: num(params, "start"),
      end: num(params, "end"),
    }),
  );
}
