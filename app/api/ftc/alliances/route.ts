import { getAlliances } from "@/lib/ftc-events/api";
import { ftcRoute, requiredNum, requiredString } from "@/lib/ftc-events/route-utils";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  return ftcRoute(() => getAlliances({ season: requiredNum(params, "season"), eventCode: requiredString(params, "eventCode") }));
}
