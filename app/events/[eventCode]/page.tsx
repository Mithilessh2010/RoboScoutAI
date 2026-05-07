import { redirect } from "next/navigation";
import { currentSeason } from "@/lib/mock-data";
import { seasonId } from "@/lib/ftc-events/page-data";

export default async function SimpleEventPage({ params, searchParams }: { params: Promise<{ eventCode: string }>; searchParams: Promise<{ season?: string }> }) {
  const { eventCode } = await params;
  const query = await searchParams;
  const season = query.season ? seasonId(Number(query.season)) : currentSeason.id;
  redirect(`/seasons/${season}/events/${eventCode}`);
}
