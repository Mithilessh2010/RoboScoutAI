import Link from "next/link";
import { Clapperboard, Upload } from "lucide-react";
import { PageShell } from "@/components/shared/page-shell";
import { LinkButton } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { videoUploads } from "@/lib/mock-data";

export default function VideosPage() {
  return (
    <PageShell title="Uploaded Video Analysis" eyebrow="Timeline tagging" actions={<LinkButton href="/videos/video-1" variant="secondary"><Clapperboard className="size-4" /> Open sample</LinkButton>}>
      <Card className="mb-6 border-dashed">
        <Upload className="size-6 text-[#E491C9]" />
        <h2 className="mt-3 text-xl font-semibold text-[#F1E9E9]">Upload video</h2>
        <p className="mt-2 text-sm text-[#F1E9E9]/62">MVP UI scaffold for associating video with season, event, match, and team. Local persistence comes next.</p>
      </Card>
      <div className="grid gap-4 md:grid-cols-2">
        {videoUploads.map((video) => (
          <Link key={video.id} href={`/videos/${video.id}`} className="rounded-lg border border-[#F1E9E9]/10 bg-[#1B1D4B]/78 p-5 hover:bg-[#F1E9E9]/8">
            <div className="text-xs uppercase tracking-[0.18em] text-[#E491C9]">{video.season} · {video.eventCode} QM{video.matchNumber}</div>
            <h2 className="mt-3 text-xl font-semibold text-[#F1E9E9]">{video.title}</h2>
            <p className="mt-2 text-sm text-[#F1E9E9]/62">{video.teamNumber ? `Focus team ${video.teamNumber}` : "Full-field video"}</p>
          </Link>
        ))}
      </div>
    </PageShell>
  );
}
