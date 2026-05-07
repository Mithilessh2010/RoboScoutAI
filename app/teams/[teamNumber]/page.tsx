import { redirect } from "next/navigation";
import { currentSeason } from "@/lib/mock-data";
import { seasonId } from "@/lib/ftc-events/page-data";

export default async function SimpleTeamPage({ params, searchParams }: { params: Promise<{ teamNumber: string }>; searchParams: Promise<{ season?: string }> }) {
  const { teamNumber } = await params;
  const query = await searchParams;
  const season = query.season ? seasonId(Number(query.season)) : currentSeason.id;
  redirect(`/seasons/${season}/teams/${teamNumber}`);
}
