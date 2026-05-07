import { MatchTable } from "@/components/events/match-table";
import { DataWarning } from "@/components/shared/data-warning";
import { PageShell } from "@/components/shared/page-shell";
import { SeasonSwitcher } from "@/components/shared/season-switcher";
import { TeamTrendChart } from "@/components/stats/team-trend-chart";
import { Card, MetricCard } from "@/components/ui/card";
import { getSeasonEvents, getTeam, getTeamMatches, matches, scoutingReports } from "@/lib/mock-data";
import { getLiveTeam, getLiveTeamEvents } from "@/lib/ftc-events/page-data";
import { getTeamOpr } from "@/lib/stats/opr";
import { multiSeasonTrend } from "@/lib/stats/seasonStats";
import { averageScore, scoutAverages, teamRecord } from "@/lib/stats/teamMetrics";

export default async function TeamDetailPage({ params }: { params: Promise<{ season: string; teamNumber: string }> }) {
  const { season, teamNumber } = await params;
  const number = Number(teamNumber);
  const liveTeam = await getLiveTeam(number, season);
  const liveEvents = await getLiveTeamEvents(number, season);
  const team =
    liveTeam.data[0] ??
    getTeam(number) ?? {
      number,
      name: "FTC Team",
      city: "",
      state: "",
      country: "",
      rookieYear: 0,
    };
  const hasKnownProfile = team.name !== "FTC Team" || Boolean(team.city || team.state || team.rookieYear);
  const teamMatches = getTeamMatches(number, season);
  const opr = getTeamOpr(matches.filter((match) => match.season === season), number);
  const record = teamRecord(teamMatches, number);
  const reports = scoutingReports.filter((report) => report.season === season && report.teamNumber === number);
  const scout = scoutAverages(reports);
  const events = liveEvents.data.length ? liveEvents.data : getSeasonEvents(season).filter((event) => event.teamNumbers.includes(number));
  const trend = multiSeasonTrend(number);
  return (
    <PageShell title={`${number} ${team.name}`} eyebrow={hasKnownProfile ? [team.city, team.state].filter(Boolean).join(", ") : "Direct team-number lookup"} actions={<SeasonSwitcher season={season} />}>
      <DataWarning message={liveTeam.warning ?? liveEvents.warning} />
      <div className="grid gap-4 md:grid-cols-5">
        <MetricCard label="OPR" value={opr?.opr.toFixed(1) ?? "0.0"} detail={`Auto ${opr?.autoOpr.toFixed(1) ?? "0.0"} · TeleOp ${opr?.teleopOpr.toFixed(1) ?? "0.0"}`} />
        <MetricCard label="Avg Score" value={averageScore(teamMatches, number).toFixed(1)} />
        <MetricCard label="Record" value={`${record.wins}-${record.losses}-${record.ties}`} />
        <MetricCard label="Reliability" value={scout.reliability ? scout.reliability.toFixed(1) : "N/A"} />
        <MetricCard label="Rookie" value={team.rookieYear || "Unknown"} />
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="space-y-6">
          {!hasKnownProfile ? (
            <Card>
              <h2 className="text-xl font-semibold text-[#F1E9E9]">Live team lookup</h2>
              <p className="mt-3 text-sm leading-6 text-[#F1E9E9]/72">
                Team {number} is not in the local mock dataset yet. RoboScoutAI opened the team page anyway so you can scout it manually; real FTC profile data will appear here after the FTC Events API returns or syncs this team.
              </p>
            </Card>
          ) : null}
          <Card>
            <h2 className="text-xl font-semibold text-[#F1E9E9]">AI Team Summary</h2>
            <p className="mt-3 text-sm leading-6 text-[#F1E9E9]/72">
              Based on provided data only: {team.name} has {teamMatches.length} matches in {season}, an estimated OPR of {opr?.opr.toFixed(1) ?? "unknown"}, and scout notes emphasizing {reports[0]?.notes ?? "no submitted notes yet"}.
            </p>
          </Card>
          <div><h2 className="mb-3 text-xl font-semibold text-[#F1E9E9]">Match History</h2><MatchTable matches={teamMatches} /></div>
        </section>
        <aside className="space-y-6">
          <Card>
            <h2 className="text-xl font-semibold text-[#F1E9E9]">Performance Trend</h2>
            <div className="mt-4 h-56">
              <TeamTrendChart data={trend} />
            </div>
          </Card>
          <Card>
            <h2 className="text-xl font-semibold text-[#F1E9E9]">Event History</h2>
            <div className="mt-3 space-y-2">{events.map((event) => <div key={event.code} className="rounded-md bg-[#F1E9E9]/5 p-3 text-sm text-[#F1E9E9]/72">{event.name}</div>)}</div>
          </Card>
          <Card>
            <h2 className="text-xl font-semibold text-[#F1E9E9]">Scout Notes</h2>
            <div className="mt-3 space-y-2">{reports.map((report) => <p key={report.id} className="rounded-md bg-[#F1E9E9]/5 p-3 text-sm text-[#F1E9E9]/72">{report.notes}</p>)}</div>
          </Card>
        </aside>
      </div>
    </PageShell>
  );
}
