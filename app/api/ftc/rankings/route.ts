import { getRankings } from "@/lib/ftc-events/api";
import { ftcRoute, num, requiredNum, requiredString } from "@/lib/ftc-events/route-utils";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  return ftcRoute(() => getRankings({ season: requiredNum(params, "season"), eventCode: requiredString(params, "eventCode"), teamNumber: num(params, "teamNumber"), top: num(params, "top") }));
}
