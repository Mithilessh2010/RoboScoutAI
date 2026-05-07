import { getApiIndex } from "@/lib/ftc-events/api";
import { ftcRoute } from "@/lib/ftc-events/route-utils";

export async function GET() {
  return ftcRoute(() => getApiIndex());
}
