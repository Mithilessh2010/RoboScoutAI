import { notFound } from "next/navigation";
import { PageShell } from "@/components/shared/page-shell";
import { VideoTagger } from "@/components/videos/video-tagger";
import { timelineEvents, videoUploads } from "@/lib/mock-data";

export default async function VideoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const video = videoUploads.find((item) => item.id === id);
  if (!video) notFound();
  return (
    <PageShell title={video.title} eyebrow={`${video.season} · ${video.eventCode} · QM${video.matchNumber}`}>
      <VideoTagger video={video} events={timelineEvents.filter((event) => event.videoId === video.id)} />
    </PageShell>
  );
}
