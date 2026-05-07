"use client";

import { useState } from "react";
import type { AutoscoreJob, AutoscoreSuggestion } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function AutoscoreReview({ job, suggestions }: { job: AutoscoreJob; suggestions: AutoscoreSuggestion[] }) {
  const [items, setItems] = useState(suggestions);
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
      <Card className="flex min-h-[420px] items-center justify-center border-dashed">
        <div className="max-w-md text-center">
          <div className="text-xs uppercase tracking-[0.18em] text-[#E491C9]">Experimental semi-automatic autoscore</div>
          <h2 className="mt-3 text-2xl font-semibold text-[#F1E9E9]">{job.title}</h2>
          <p className="mt-3 text-[#F1E9E9]/62">Future pipeline: video frames, object detection, event detection, scoring logic, confidence scoring, then human review.</p>
          <div className="mt-6 h-3 overflow-hidden rounded-full bg-[#F1E9E9]/10">
            <div className="h-full bg-[#982598]" style={{ width: `${job.confidence * 100}%` }} />
          </div>
          <p className="mt-2 text-sm text-[#F1E9E9]/62">Overall confidence {Math.round(job.confidence * 100)}%</p>
        </div>
      </Card>
      <Card>
        <div className="text-xs uppercase tracking-[0.18em] text-[#F1E9E9]/50">AI Suggested Events</div>
        <div className="mt-3 space-y-3">
          {items.map((item) => (
            <div key={item.id} className="rounded-md border border-[#F1E9E9]/10 p-3">
              <div className="flex justify-between text-sm text-[#F1E9E9]"><span>{item.type}</span><span>{item.timestamp}s</span></div>
              <div className="mt-1 text-xs text-[#F1E9E9]/62">Confidence {Math.round(item.confidence * 100)}% · {item.status}</div>
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => setItems((rows) => rows.map((row) => row.id === item.id ? { ...row, status: "confirmed" } : row))}>Confirm</Button>
                <Button size="sm" variant="ghost" onClick={() => setItems((rows) => rows.map((row) => row.id === item.id ? { ...row, status: "corrected" } : row))}>Correct</Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
