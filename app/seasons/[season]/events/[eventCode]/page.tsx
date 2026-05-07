import Link from "next/link";
import { notFound } from "next/navigation";
import { MatchTable } from "@/components/events/match-table";
import { DataWarning } from "@/components/shared/data-warning";
import { PageShell } from "@/components/shared/page-shell";
import { OprTable } from "@/components/stats/opr-table";
import { LinkButton } from "@/components/ui/button";
import { Card, MetricCard } from "@/components/ui/card";
import { Table, Td, Th } from "@/components/ui/table";
import { getEvent, getTeam, streamLinks } from "@/lib/mock-data";
import { getLiveEvent, getLiveEventAwards, getLiveEventMatches, getLiveEventRankings, getLiveEventSchedule, getLiveEventTeams } from "@/lib/ftc-events/page-data";
import type { Team } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export default async function EventDetailPage({ params }: { params: Promise<{ season: string; eventCode: string }> }) {
  const { season, eventCode } = await params;
  const liveEvent = await getLiveEvent(eventCode, season);
  const event = liveEvent.data[0] ?? getEvent(eventCode, season);
  if (!event) notFound();
  const [eventTeams, liveRankings, liveSchedule, liveMatches, liveAwards] = await Promise.all([
    getLiveEventTeams(event.code, season),
    getLiveEventRankings(event.code, season),
    getLiveEventSchedule(event.code, season),
    getLiveEventMatches(event.code, season),
    getLiveEventAwards(event.code, season),
  ]);
  const eventMatches = liveMatches.data.length ? liveMatches.data : liveSchedule.data;
  const eventRankings = liveRankings.data.sort((a, b) => a.rank - b.rank);
  const eventAwards = liveAwards.data;
  const attendingTeams = eventTeams.data.length
    ? eventTeams.data
    : event.teamNumbers.map((number) => getTeam(number)).filter((team): team is Team => Boolean(team));
  const streams = streamLinks.filter((stream) => stream.eventCode === event.code);
  const warning = liveEvent.warning ?? eventTeams.warning ?? liveRankings.warning ?? liveMatches.warning ?? liveAwards.warning;
  return (
    <PageShell title={event.name} eyebrow={`${event.code} · ${event.city}, ${event.state}`} actions={<LinkButton href={`/seasons/${season}/events/${event.code}/watch`}>Watch Room</LinkButton>}>
      <DataWarning message={warning} />
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Teams" value={eventTeams.data.length || event.teamNumbers.length} />
        <MetricCard label="Matches" value={eventMatches.length} />
        <MetricCard label="Streams" value={streams.length} />
        <MetricCard label="Dates" value={formatDate(event.startDate)} detail={formatDate(event.endDate)} />
      </div>
      <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_420px]">
        <section className="space-y-6">
          <div><h2 className="mb-3 text-xl font-semibold text-[#F1E9E9]">Match Schedule and Results</h2>{eventMatches.length ? <MatchTable matches={eventMatches} /> : <EmptyState text="No published schedule or match results yet." />}</div>
          <div><h2 className="mb-3 text-xl font-semibold text-[#F1E9E9]">OPR / Stat Table</h2>{eventMatches.filter((match) => match.status === "complete").length >= 2 ? <OprTable matches={eventMatches} /> : <EmptyState text="Not enough completed matches to calculate OPR yet." />}</div>
        </section>
        <aside className="space-y-6">
          <Card>
            <h2 className="text-xl font-semibold text-[#F1E9E9]">Teams Attending</h2>
            <div className="mt-3 grid grid-cols-2 gap-2">{attendingTeams.map((team) => <Link key={team.number} className="rounded-md bg-[#F1E9E9]/5 p-2 text-sm text-[#E491C9]" href={`/seasons/${season}/teams/${team.number}`}>{team.number} {team.name}</Link>)}</div>
          </Card>
          <Card>
            <h2 className="text-xl font-semibold text-[#F1E9E9]">Rankings</h2>
            <Table className="mt-3"><thead><tr><Th>#</Th><Th>Team</Th><Th>Record</Th><Th>RP</Th></tr></thead><tbody>{eventRankings.slice(0, 10).map((row) => <tr key={row.teamNumber}><Td>{row.rank}</Td><Td>{row.teamNumber}</Td><Td>{row.wins}-{row.losses}-{row.ties}</Td><Td>{row.rp}</Td></tr>)}</tbody></Table>
          </Card>
          <Card>
            <h2 className="text-xl font-semibold text-[#F1E9E9]">Awards</h2>
            <div className="mt-3 space-y-2">{eventAwards.length ? eventAwards.map((award) => <div key={`${award.name}-${award.recipient}`} className="rounded-md bg-[#F1E9E9]/5 p-3 text-sm text-[#F1E9E9]/72">{award.name}: {award.recipient}</div>) : <p className="text-sm text-[#F1E9E9]/62">No awards published yet.</p>}</div>
          </Card>
        </aside>
      </div>
    </PageShell>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="rounded-lg border border-[#F1E9E9]/10 bg-[#111331]/38 p-4 text-sm text-[#F1E9E9]/62">{text}</div>;
}
