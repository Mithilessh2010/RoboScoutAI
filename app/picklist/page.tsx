import { Bot, GripVertical } from "lucide-react";
import { PageShell } from "@/components/shared/page-shell";
import { Card } from "@/components/ui/card";
import { picklists, getTeam } from "@/lib/mock-data";

export default function PicklistPage() {
  const picklist = picklists[0];
  return (
    <PageShell title="Picklist" eyebrow={`${picklist.season} · ${picklist.eventCode}`}>
      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <Card>
          <h2 className="text-xl font-semibold text-[#F1E9E9]">{picklist.name}</h2>
          <div className="mt-4 space-y-3">
            {picklist.entries.map((entry) => (
              <div key={entry.teamNumber} className="flex items-center gap-3 rounded-lg border border-[#F1E9E9]/10 bg-[#F1E9E9]/5 p-3">
                <GripVertical className="size-5 text-[#F1E9E9]/50" />
                <div className="flex size-9 items-center justify-center rounded-md bg-[#982598] text-sm font-semibold text-[#F1E9E9]">{entry.rank}</div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-[#F1E9E9]">{entry.teamNumber} {getTeam(entry.teamNumber)?.name}</div>
                  <div className="text-sm text-[#F1E9E9]/62">{entry.notes}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <Bot className="size-6 text-[#E491C9]" />
          <h2 className="mt-3 text-xl font-semibold text-[#F1E9E9]">AI Reasoning</h2>
          <p className="mt-2 text-sm leading-6 text-[#F1E9E9]/62">Prioritize 8644 for consistency and autonomous floor. Verify 9889 penalty risk before selecting as a ceiling pick. 11047 is a strong role-complement if defense is needed.</p>
        </Card>
      </div>
    </PageShell>
  );
}
