import { getAwardList } from "@/lib/ftc-events/api";
import { ftcRoute, requiredNum } from "@/lib/ftc-events/route-utils";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  return ftcRoute(() => getAwardList(requiredNum(params, "season")));
}
