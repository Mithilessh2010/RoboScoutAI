import { Activity, BarChart3, Bot, Clapperboard, Radio, Trophy, Users } from "lucide-react";
import { LinkButton } from "@/components/ui/button";
import { Card, MetricCard } from "@/components/ui/card";
import { SearchBox } from "@/components/shared/search-box";
import { FadeUp, MotionPage } from "@/components/shared/motion";
import { currentSeason, events, seasons, teams } from "@/lib/mock-data";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <MotionPage>
      <section className="py-12 md:py-20">
        <div className="grid gap-10 lg:grid-cols-[1fr_420px] lg:items-end">
          <div className="max-w-4xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#E491C9]">FTC scouting command center</p>
            <h1 className="mt-5 max-w-3xl text-5xl font-semibold leading-[0.98] tracking-[-0.045em] text-[#F1E9E9] md:text-7xl">
              Competition intelligence for FTC teams.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-[#F1E9E9]/70 md:text-lg">
              RoboScoutAI brings FTCScout-style data density into a calmer, faster workspace for seasons, teams, events, OPR, match review, scouting notes, and watch-room strategy.
            </p>
            <div className="mt-8"><SearchBox /></div>
            <div className="mt-8 flex flex-wrap gap-3">
              <LinkButton href={`/seasons/${currentSeason.id}`}>Open {currentSeason.gameName}</LinkButton>
              <LinkButton href="/watch" variant="secondary"><Radio className="size-4" /> Watch Room</LinkButton>
              <LinkButton href="/assistant" variant="secondary"><Bot className="size-4" /> AI Assistant</LinkButton>
            </div>
          </div>
          <Card className="border-[#E491C9]/20 bg-[#111331]/78 p-5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#E491C9]">Live workspace</div>
            <div className="mt-5 space-y-3">
              {[
                ["Current season", currentSeason.gameName],
                ["Primary workflow", "Scout, compare, review"],
                ["Data mode", "Mock + FTC API layer"],
                ["Watch setup", "1 / 2 / 4 stream control"],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between border-b border-[#F1E9E9]/8 pb-3 text-sm">
                  <span className="text-[#F1E9E9]/54">{label}</span>
                  <span className="font-medium text-[#F1E9E9]">{value}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-4">
          <FadeUp><MetricCard label="Seasons" value={seasons.length} detail="Current and past" /></FadeUp>
          <FadeUp delay={0.03}><MetricCard label="Teams" value={teams.length} detail="Mock FTC dataset" /></FadeUp>
          <FadeUp delay={0.06}><MetricCard label="Events" value={events.length} detail="Schedules and results" /></FadeUp>
          <FadeUp delay={0.09}><MetricCard label="AI Pipeline" value="Scaffolded" detail="Human-reviewed autoscore" /></FadeUp>
        </div>
      </section>
      <section className="grid gap-4 md:grid-cols-3">
        {[
          { icon: Users, title: "FTCScout browsing", text: "Teams, events, matches, rankings, awards, histories, OPR, and season-wide stat tables." },
          { icon: Radio, title: "Blue Alliance-style watch", text: "Add YouTube streams, switch 1/2/4 layouts, view schedules, and save watch notes." },
          { icon: Clapperboard, title: "Video tagging", text: "Associate uploads with teams and matches, tag timeline events, and generate review stats." },
          { icon: Bot, title: "AI strategy", text: "Use only provided app data to summarize teams, compare robots, and draft match plans." },
          { icon: BarChart3, title: "OPR and trends", text: "Least-squares OPR plus auto, TeleOp, endgame, records, averages, and multi-season trends." },
          { icon: Trophy, title: "Picklists", text: "Build event picklists with notes, ratings, stats, and AI reasoning scaffolds." },
        ].map((feature) => (
          <FadeUp key={feature.title}>
            <Card>
              <feature.icon className="size-6 text-[#E491C9]" />
              <h2 className="mt-4 text-xl font-semibold text-[#F1E9E9]">{feature.title}</h2>
              <p className="mt-2 text-sm leading-6 text-[#F1E9E9]/62">{feature.text}</p>
            </Card>
          </FadeUp>
        ))}
      </section>
      <section className="mt-10 grid gap-4 md:grid-cols-2">
        <Card>
          <Activity className="size-6 text-[#E491C9]" />
          <h2 className="mt-4 text-xl font-semibold text-[#F1E9E9]">Current Season Quick Links</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            <LinkButton href={`/seasons/${currentSeason.id}/teams`} variant="secondary">Teams</LinkButton>
            <LinkButton href={`/seasons/${currentSeason.id}/events`} variant="secondary">Events</LinkButton>
            <LinkButton href="/scout" variant="secondary">Scout</LinkButton>
            <LinkButton href="/videos" variant="secondary">Videos</LinkButton>
          </div>
        </Card>
        <Card>
          <h2 className="text-xl font-semibold text-[#F1E9E9]">Past Seasons</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {seasons.map((season) => <LinkButton key={season.id} href={`/seasons/${season.id}`} variant="secondary">{season.name}</LinkButton>)}
          </div>
        </Card>
      </section>
      </MotionPage>
    </main>
  );
}
