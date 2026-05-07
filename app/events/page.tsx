import { EventTable } from "@/components/events/event-table";
import { DataWarning } from "@/components/shared/data-warning";
import { PageShell } from "@/components/shared/page-shell";
import { SeasonSwitcher } from "@/components/shared/season-switcher";
import { currentSeason } from "@/lib/mock-data";
import { getLiveEvents, seasonId } from "@/lib/ftc-events/page-data";

export default async function EventsPage({ searchParams }: { searchParams: Promise<{ season?: string; q?: string }> }) {
  const params = await searchParams;
  const season = params.season ? seasonId(Number(params.season)) : currentSeason.id;
  const result = await getLiveEvents(season);
  const q = (params.q ?? "").toLowerCase();
  const filtered = q ? result.data.filter((event) => `${event.code} ${event.name} ${event.city} ${event.state}`.toLowerCase().includes(q)) : result.data;
  return (
    <PageShell title="Events" eyebrow={season} actions={<SeasonSwitcher season={season} />}>
      <DataWarning message={result.warning} />
      <EventTable events={filtered} />
    </PageShell>
  );
}
