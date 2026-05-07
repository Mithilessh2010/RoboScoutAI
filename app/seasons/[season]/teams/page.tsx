import { PageShell } from "@/components/shared/page-shell";
import { DataWarning } from "@/components/shared/data-warning";
import { SeasonSwitcher } from "@/components/shared/season-switcher";
import { TeamTable } from "@/components/teams/team-table";
import { getLiveTeams } from "@/lib/ftc-events/page-data";

export default async function SeasonTeamsPage({ params }: { params: Promise<{ season: string }> }) {
  const { season } = await params;
  const result = await getLiveTeams(season);
  return (
    <PageShell title="Teams" eyebrow={season} actions={<SeasonSwitcher season={season} />}>
      <DataWarning message={result.warning} />
      <TeamTable teams={result.data} season={season} />
    </PageShell>
  );
}
