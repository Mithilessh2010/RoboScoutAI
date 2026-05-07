import { getSeasonSummary } from "@/lib/ftc-events/api";
import { ftcRoute } from "@/lib/ftc-events/route-utils";

export async function GET(_request: Request, { params }: { params: Promise<{ season: string }> }) {
  const { season } = await params;
  return ftcRoute(() => getSeasonSummary(Number(season)));
}
