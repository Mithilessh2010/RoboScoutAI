import { Activity, Clapperboard, Radio, Star } from "lucide-react";
import { PageShell } from "@/components/shared/page-shell";
import { LinkButton } from "@/components/ui/button";
import { Card, MetricCard } from "@/components/ui/card";
import { events, scoutingReports, streamLinks, videoUploads } from "@/lib/mock-data";

export default function DashboardPage() {
  return (
    <PageShell title="Dashboard" eyebrow="Team workspace">
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Favorites" value="4" detail="Mock workspace" />
        <MetricCard label="Scout Reports" value={scoutingReports.length} />
        <MetricCard label="Videos" value={videoUploads.length} />
        <MetricCard label="Streams" value={streamLinks.length} />
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card><Star className="size-6 text-[#E491C9]" /><h2 className="mt-3 text-xl font-semibold text-[#F1E9E9]">Favorite Teams</h2><p className="mt-2 text-sm text-[#F1E9E9]/62">8644, 9889, 11047, 13406</p></Card>
        <Card><Activity className="size-6 text-[#E491C9]" /><h2 className="mt-3 text-xl font-semibold text-[#F1E9E9]">Recent Events</h2><p className="mt-2 text-sm text-[#F1E9E9]/62">{events.slice(0, 3).map((event) => event.name).join(", ")}</p></Card>
        <Card><Clapperboard className="size-6 text-[#E491C9]" /><h2 className="mt-3 text-xl font-semibold text-[#F1E9E9]">Recent Video Analyses</h2><p className="mt-2 text-sm text-[#F1E9E9]/62">{videoUploads.map((video) => video.title).join(", ")}</p></Card>
      </div>
      <div className="mt-6 flex flex-wrap gap-2">
        <LinkButton href="/scout"><Radio className="size-4" /> New scouting report</LinkButton>
        <LinkButton href="/watch" variant="secondary">Open watch room</LinkButton>
        <LinkButton href="/videos" variant="secondary">Tag video</LinkButton>
      </div>
    </PageShell>
  );
}
