import { AssistantPanel } from "@/components/assistant/assistant-panel";
import { PageShell } from "@/components/shared/page-shell";
import { matches, scoutingReports, timelineEvents } from "@/lib/mock-data";
import { seasonTeamTable } from "@/lib/stats/seasonStats";

export default function AssistantPage() {
  const context = {
    seasonStats: seasonTeamTable("2025-2026").slice(0, 8),
    recentMatches: matches.filter((match) => match.season === "2025-2026").slice(0, 6),
    scoutingReports,
    timelineEvents,
  };
  return (
    <PageShell title="AI Scouting Assistant" eyebrow="OpenRouter-powered">
      <AssistantPanel context={context} />
    </PageShell>
  );
}
