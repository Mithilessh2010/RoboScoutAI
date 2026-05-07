import { getTeams } from "@/lib/ftc-events/api";
import { bool, ftcRoute, num, requiredNum } from "@/lib/ftc-events/route-utils";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  return ftcRoute(() =>
    getTeams({
      season: requiredNum(params, "season"),
      teamNumber: num(params, "teamNumber"),
      eventCode: params.get("eventCode") ?? undefined,
      state: params.get("state") ?? undefined,
      excludeNonCompeting: bool(params, "excludeNonCompeting"),
      page: num(params, "page"),
    }),
  );
}
