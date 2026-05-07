import { notFound } from "next/navigation";
import { AutoscoreReview } from "@/components/autoscore/autoscore-review";
import { PageShell } from "@/components/shared/page-shell";
import { autoscoreJobs, autoscoreSuggestions } from "@/lib/mock-data";

export default async function AutoscoreJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = autoscoreJobs.find((item) => item.id === id);
  if (!job) notFound();
  return (
    <PageShell title={job.title} eyebrow="Human-confirmed autoscore review">
      <AutoscoreReview job={job} suggestions={autoscoreSuggestions.filter((item) => item.jobId === job.id)} />
    </PageShell>
  );
}
