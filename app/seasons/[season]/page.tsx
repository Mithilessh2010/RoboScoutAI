import { notFound } from "next/navigation";
import { EventTable } from "@/components/events/event-table";
import { DataWarning } from "@/components/shared/data-warning";
import { PageShell } from "@/components/shared/page-shell";
import { SeasonSwitcher } from "@/components/shared/season-switcher";
import { OprTable } from "@/components/stats/opr-table";
import { TeamTable } from "@/components/teams/team-table";
import { LinkButton } from "@/components/ui/button";
import { MetricCard } from "@/components/ui/card";
import { getSeason, getSeasonEvents, getSeasonTeams, matches, seasons } from "@/lib/mock-data";
import { getLiveEvents, getLiveSeasonSummary, getLiveTeams, seasonYear } from "@/lib/ftc-events/page-data";

export default async function SeasonPage({ params }: { params: Promise<{ season: string }> }) {
  const { season: seasonId } = await params;
  if (!seasons.some((item) => item.id === seasonId)) notFound();
  const season = getSeason(seasonId);
  const [summary, liveEvents, liveTeams] = await Promise.all([getLiveSeasonSummary(seasonYear(seasonId)), getLiveEvents(seasonId), getLiveTeams(seasonId)]);
  const seasonEvents = liveEvents.data.length ? liveEvents.data : getSeasonEvents(seasonId);
  const seasonTeams = liveTeams.data.length ? liveTeams.data : getSeasonTeams(seasonId);
  const seasonMatches = matches.filter((match) => match.season === seasonId);
  return (
    <PageShell title={`${season.name} ${season.gameName}`} eyebrow="Season hub" actions={<SeasonSwitcher season={seasonId} />}>
      <DataWarning message={summary.warning ?? liveEvents.warning ?? liveTeams.warning} />
      <div className="grid gap-4 md:grid-cols-5">
        <MetricCard label="Teams" value={seasonTeams.length} />
        <MetricCard label="Events" value={seasonEvents.length} />
        <MetricCard label="Matches" value={seasonMatches.length} />
        <MetricCard label="Completed" value={seasonMatches.filter((match) => match.status === "complete").length} />
        <MetricCard label="Kickoff" value={season.kickoff} />
      </div>
      <div className="mt-6 flex flex-wrap gap-2">
        <LinkButton href={`/seasons/${seasonId}/teams`} variant="secondary">All teams</LinkButton>
        <LinkButton href={`/seasons/${seasonId}/events`} variant="secondary">All events</LinkButton>
        <LinkButton href="/compare" variant="secondary">Compare teams</LinkButton>
      </div>
      <div className="mt-8 grid gap-8 xl:grid-cols-2">
        <section><h2 className="mb-3 text-xl font-semibold text-[#F1E9E9]">Teams</h2><TeamTable teams={seasonTeams.slice(0, 10)} season={seasonId} /></section>
        <section><h2 className="mb-3 text-xl font-semibold text-[#F1E9E9]">Events</h2><EventTable events={seasonEvents} /></section>
      </div>
      <section className="mt-8"><h2 className="mb-3 text-xl font-semibold text-[#F1E9E9]">Season OPR</h2><OprTable matches={seasonMatches} /></section>
    </PageShell>
  );
}
