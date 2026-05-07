import { EventTable } from "@/components/events/event-table";
import { DataWarning } from "@/components/shared/data-warning";
import { PageShell } from "@/components/shared/page-shell";
import { SeasonSwitcher } from "@/components/shared/season-switcher";
import { getLiveEvents } from "@/lib/ftc-events/page-data";

export default async function SeasonEventsPage({ params }: { params: Promise<{ season: string }> }) {
  const { season } = await params;
  const result = await getLiveEvents(season);
  return (
    <PageShell title="Events" eyebrow={season} actions={<SeasonSwitcher season={season} />}>
      <DataWarning message={result.warning} />
      <EventTable events={result.data} />
    </PageShell>
  );
}
