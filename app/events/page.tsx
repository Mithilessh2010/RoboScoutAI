import { EventTable } from "@/components/events/event-table";
import { DataWarning } from "@/components/shared/data-warning";
import { PageShell } from "@/components/shared/page-shell";
import { SeasonSwitcher } from "@/components/shared/season-switcher";
import { LinkButton } from "@/components/ui/button";
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
      <form className="mb-4 flex flex-wrap items-center gap-3" method="get">
        <input type="hidden" name="season" value={season} />
        <input
          name="q"
          defaultValue={params.q ?? ""}
          placeholder="Filter events by code, name, city, or state"
          className="rs-input h-10 min-w-[280px] flex-1 rounded-md px-3 text-sm"
        />
        <LinkButton href={`/events?season=${season}`} variant="secondary" size="sm">Reset</LinkButton>
      </form>
      <EventTable events={filtered} />
    </PageShell>
  );
}
