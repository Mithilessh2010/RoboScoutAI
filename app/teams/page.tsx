import { DataWarning } from "@/components/shared/data-warning";
import { PageShell } from "@/components/shared/page-shell";
import { SeasonSwitcher } from "@/components/shared/season-switcher";
import { TeamTable } from "@/components/teams/team-table";
import { LinkButton } from "@/components/ui/button";
import { currentSeason } from "@/lib/mock-data";
import { getLiveTeams, seasonId } from "@/lib/ftc-events/page-data";

export default async function TeamsPage({ searchParams }: { searchParams: Promise<{ season?: string; page?: string }> }) {
  const params = await searchParams;
  const season = params.season ? seasonId(Number(params.season)) : currentSeason.id;
  const page = Math.max(1, Number(params.page ?? 1) || 1);
  const result = await getLiveTeams(season, page);
  return (
    <PageShell title="Teams" eyebrow={season} actions={<SeasonSwitcher season={season} />}>
      <DataWarning message={result.warning} />
      <TeamTable teams={result.data} season={season} />
      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-sm text-[#F1E9E9]/62">FTC teams are paginated. Page {page} is shown below.</p>
        <div className="flex gap-2">
          {page > 1 ? <LinkButton href={`/teams?season=${season}&page=${page - 1}`} variant="secondary" size="sm">Previous</LinkButton> : null}
          <LinkButton href={`/teams?season=${season}&page=${page + 1}`} variant="secondary" size="sm">Next</LinkButton>
        </div>
      </div>
    </PageShell>
  );
}
