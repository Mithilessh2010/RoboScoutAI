"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { LayoutGrid, Plus, Save } from "lucide-react";
import type { Event, Match, StreamLink } from "@/lib/types";
import { youtubeEmbedUrl } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function WatchRoom({ streams, matches, event }: { streams: StreamLink[]; matches: Match[]; event?: Event }) {
  const [layout, setLayout] = useState<1 | 2 | 4>(streams.length >= 4 ? 4 : streams.length >= 2 ? 2 : 1);
  const [localStreams, setLocalStreams] = useState(streams);
  const [url, setUrl] = useState("");
  const [notes, setNotes] = useState("");
  const visibleStreams = localStreams.slice(0, layout);
  const currentMatch = useMemo(() => matches.find((match) => match.status === "scheduled") ?? matches[matches.length - 1], [matches]);

  function addStream() {
    if (!url.trim()) return;
    setLocalStreams((items) => [...items, { id: `local-${Date.now()}`, season: event?.season ?? "2025-2026", eventCode: event?.code, label: "Added stream", url }]);
    setUrl("");
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
      <section className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-[#F1E9E9]/10 bg-[#111331]/54 p-2">
          {[1, 2, 4].map((value) => (
            <Button key={value} variant={layout === value ? "primary" : "secondary"} size="sm" onClick={() => setLayout(value as 1 | 2 | 4)}>
              <LayoutGrid className="size-4" /> {value}
            </Button>
          ))}
          <div className="ml-auto flex min-w-72 flex-1 gap-2">
            <input className="rs-input h-10 min-w-0 flex-1 rounded-md px-3 text-sm" placeholder="Add YouTube or embed URL" value={url} onChange={(event) => setUrl(event.target.value)} />
            <Button variant="secondary" onClick={addStream}><Plus className="size-4" /> Add</Button>
          </div>
        </div>
        <motion.div layout className={layout === 1 ? "grid gap-4" : layout === 2 ? "grid gap-4 lg:grid-cols-2" : "grid gap-4 lg:grid-cols-2"} transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}>
          {visibleStreams.map((stream) => (
            <motion.div layout key={stream.id} className="overflow-hidden rounded-lg border border-[#F1E9E9]/10 bg-[#070817] shadow-[0_20px_60px_rgba(0,0,0,0.25)]" transition={{ duration: 0.22 }}>
              <div className="flex items-center justify-between border-b border-[#F1E9E9]/10 bg-[#111331] px-3 py-2 text-sm text-[#F1E9E9]/72">
                <span>{stream.label}</span>
                <span className="text-[#E491C9]">{stream.field}</span>
              </div>
              <iframe className="aspect-video w-full" src={youtubeEmbedUrl(stream.url)} title={stream.label} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen />
            </motion.div>
          ))}
        </motion.div>
      </section>
      <aside className="space-y-4">
        <Card>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#E491C9]">Current Match</div>
          <div className="mt-2 text-2xl font-semibold text-[#F1E9E9]">QM{currentMatch?.matchNumber ?? "--"}</div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-md border border-[#E491C9]/20 bg-[#982598]/16 p-3 text-[#F1E9E9]">{currentMatch?.red.teams.join(" / ")}</div>
            <div className="rounded-md border border-[#F1E9E9]/10 bg-[#15173D]/70 p-3 text-[#F1E9E9]/82">{currentMatch?.blue.teams.join(" / ")}</div>
          </div>
        </Card>
        <Card>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#F1E9E9]/54">Schedule</div>
          <div className="mt-3 max-h-80 space-y-2 overflow-auto">
            {matches.map((match) => (
              <div key={match.id} className="flex justify-between rounded-md border border-transparent bg-[#F1E9E9]/5 px-3 py-2 text-sm text-[#F1E9E9]/72 transition hover:border-[#E491C9]/20 hover:bg-[#E491C9]/8">
                <span>QM{match.matchNumber}</span>
                <span>{match.status === "complete" ? `${match.red.score}-${match.blue.score}` : "Queued"}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#F1E9E9]/54">Watch Notes</div>
          <textarea className="rs-input mt-3 min-h-36 w-full rounded-md p-3 text-sm" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Capture strategy, robot failures, cycles, and drive-team observations." />
          <Button className="mt-3 w-full" variant="secondary"><Save className="size-4" /> Save note locally</Button>
        </Card>
      </aside>
    </div>
  );
}
