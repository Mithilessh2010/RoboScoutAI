import { AssistantPanel } from "@/components/assistant/assistant-panel";
import { PageShell } from "@/components/shared/page-shell";
import { Card, MetricCard } from "@/components/ui/card";
import { currentSeason, getTeam, matches } from "@/lib/mock-data";
import { calculateOpr } from "@/lib/stats/opr";

export default function ComparePage() {
  const selected = [8644, 9889, 11047, 13406];
  const opr = new Map(calculateOpr(matches.filter((match) => match.season === currentSeason.id)).map((row) => [row.teamNumber, row]));
  const context = selected.map((teamNumber) => ({ team: getTeam(teamNumber), opr: opr.get(teamNumber) }));
  return (
    <PageShell title="Team Comparison" eyebrow="2-4 team strategy view">
      <div className="grid gap-4 md:grid-cols-4">
        {selected.map((teamNumber) => (
          <MetricCard key={teamNumber} label={`${teamNumber} ${getTeam(teamNumber)?.name}`} value={opr.get(teamNumber)?.opr.toFixed(1) ?? "0.0"} detail="Estimated OPR" />
        ))}
      </div>
      <Card className="mt-6">
        <h2 className="text-xl font-semibold text-[#F1E9E9]">Comparison Inputs</h2>
        <p className="mt-2 text-sm text-[#F1E9E9]/62">MVP selectors are scaffolded; sample comparison uses four teams from the current mock season.</p>
      </Card>
      <div className="mt-6"><AssistantPanel context={context} /></div>
    </PageShell>
  );
}
