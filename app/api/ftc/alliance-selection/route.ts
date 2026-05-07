import { getAllianceSelection } from "@/lib/ftc-events/api";
import { ftcRoute, requiredNum, requiredString } from "@/lib/ftc-events/route-utils";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  return ftcRoute(() => getAllianceSelection({ season: requiredNum(params, "season"), eventCode: requiredString(params, "eventCode") }));
}
