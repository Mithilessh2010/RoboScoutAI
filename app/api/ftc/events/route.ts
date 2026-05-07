import { getEvents } from "@/lib/ftc-events/api";
import { ftcRoute, num, requiredNum } from "@/lib/ftc-events/route-utils";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  return ftcRoute(() =>
    getEvents({
      season: requiredNum(params, "season"),
      eventCode: params.get("eventCode") ?? undefined,
      teamNumber: num(params, "teamNumber"),
    }),
  );
}
