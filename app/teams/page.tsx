import { DataWarning } from "@/components/shared/data-warning";
import { PageShell } from "@/components/shared/page-shell";
import { SeasonSwitcher } from "@/components/shared/season-switcher";
import { TeamTable } from "@/components/teams/team-table";
import { currentSeason } from "@/lib/mock-data";
import { getLiveTeams, seasonId } from "@/lib/ftc-events/page-data";

export default async function TeamsPage({ searchParams }: { searchParams: Promise<{ season?: string; page?: string }> }) {
  const params = await searchParams;
  const season = params.season ? seasonId(Number(params.season)) : currentSeason.id;
  const result = await getLiveTeams(season, Number(params.page ?? 1));
  return (
    <PageShell title="Teams" eyebrow={season} actions={<SeasonSwitcher season={season} />}>
      <DataWarning message={result.warning} />
      <TeamTable teams={result.data} season={season} />
    </PageShell>
  );
}
