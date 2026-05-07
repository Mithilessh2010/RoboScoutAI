import { redirect } from "next/navigation";
import { currentSeason } from "@/lib/mock-data";

export default async function SimpleEventWatchPage({ params }: { params: Promise<{ eventCode: string }> }) {
  const { eventCode } = await params;
  redirect(`/seasons/${currentSeason.id}/events/${eventCode}/watch`);
}
