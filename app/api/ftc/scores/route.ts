import { getScoreDetails } from "@/lib/ftc-events/api";
import { ftcRoute, num, requiredNum, requiredString } from "@/lib/ftc-events/route-utils";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  return ftcRoute(() =>
    getScoreDetails({
      season: requiredNum(params, "season"),
      eventCode: requiredString(params, "eventCode"),
      tournamentLevel: requiredString(params, "tournamentLevel") as "qual" | "playoff",
      teamNumber: num(params, "teamNumber"),
      matchNumber: num(params, "matchNumber"),
      start: num(params, "start"),
      end: num(params, "end"),
    }),
  );
}
