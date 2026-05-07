import { redirect } from "next/navigation";
import { currentSeason } from "@/lib/mock-data";

export default async function SimpleTeamPage({ params }: { params: Promise<{ teamNumber: string }> }) {
  const { teamNumber } = await params;
  redirect(`/seasons/${currentSeason.id}/teams/${teamNumber}`);
}
