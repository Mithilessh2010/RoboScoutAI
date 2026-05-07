import Link from "next/link";
import { Gauge, Upload } from "lucide-react";
import { PageShell } from "@/components/shared/page-shell";
import { Card } from "@/components/ui/card";
import { autoscoreJobs } from "@/lib/mock-data";

export default function AutoscorePage() {
  return (
    <PageShell title="AI Autoscore Lab" eyebrow="Experimental scaffold">
      <Card className="mb-6 border-dashed">
        <Upload className="size-6 text-[#E491C9]" />
        <h2 className="mt-3 text-xl font-semibold text-[#F1E9E9]">Upload video for semi-automatic review</h2>
        <p className="mt-2 text-sm leading-6 text-[#F1E9E9]/62">This MVP does not pretend to score matches automatically. It scaffolds the human-confirmed workflow for future YOLO, Roboflow, and OpenCV integration.</p>
      </Card>
      <div className="grid gap-4 md:grid-cols-2">
        {autoscoreJobs.map((job) => (
          <Link key={job.id} href={`/autoscore/${job.id}`} className="rounded-lg border border-[#F1E9E9]/10 bg-[#1B1D4B]/78 p-5 hover:bg-[#F1E9E9]/8">
            <Gauge className="size-6 text-[#E491C9]" />
            <h2 className="mt-3 text-xl font-semibold text-[#F1E9E9]">{job.title}</h2>
            <p className="mt-2 text-sm text-[#F1E9E9]/62">Status {job.status} · confidence {Math.round(job.confidence * 100)}%</p>
          </Link>
        ))}
      </div>
    </PageShell>
  );
}
