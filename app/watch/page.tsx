import { PageShell } from "@/components/shared/page-shell";
import { WatchRoom } from "@/components/watch/watch-room";
import { getEventMatches, streamLinks } from "@/lib/mock-data";

export default function WatchPage() {
  return (
    <PageShell title="Watch Room" eyebrow="Multi-stream FTC viewing">
      <WatchRoom streams={streamLinks} matches={getEventMatches("2025ca-sj")} />
    </PageShell>
  );
}
