import { getHybridSchedule } from "@/lib/ftc-events/api";
import { ftcRoute, num, requiredNum, requiredString } from "@/lib/ftc-events/route-utils";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  return ftcRoute(() =>
    getHybridSchedule({
      season: requiredNum(params, "season"),
      eventCode: requiredString(params, "eventCode"),
      tournamentLevel: requiredString(params, "tournamentLevel") as "qual" | "playoff",
      start: num(params, "start"),
      end: num(params, "end"),
    }),
  );
}
