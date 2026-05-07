import { PageShell } from "@/components/shared/page-shell";
import { WatchRoom } from "@/components/watch/watch-room";
import { getEvent, getEventMatches, streamLinks } from "@/lib/mock-data";

export default async function EventWatchPage({ params }: { params: Promise<{ season: string; eventCode: string }> }) {
  const { season, eventCode } = await params;
  const event = getEvent(eventCode, season);
  return (
    <PageShell title={event ? `${event.name} Watch Room` : "Watch Room"} eyebrow="Livestream command">
      <WatchRoom event={event} streams={streamLinks.filter((stream) => stream.eventCode === eventCode)} matches={getEventMatches(eventCode)} />
    </PageShell>
  );
}
