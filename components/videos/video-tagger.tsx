"use client";

import { useMemo, useRef, useState } from "react";
import { Plus } from "lucide-react";
import type { TimelineEvent, VideoUpload } from "@/lib/types";
import { getGameConfig } from "@/lib/game-config";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function VideoTagger({ video, events: initialEvents }: { video: VideoUpload; events: TimelineEvent[] }) {
  const player = useRef<HTMLVideoElement>(null);
  const [items, setItems] = useState(initialEvents);
  const [type, setType] = useState("scored artifact");
  const config = getGameConfig(video.season);
  const generated = useMemo(() => {
    const scored = items.filter((item) => item.type.includes("scored")).length;
    const misses = items.filter((item) => item.type.includes("miss")).length;
    return { scored, misses, reliability: items.length ? Math.round((scored / items.length) * 100) : 0 };
  }, [items]);

  function addTag() {
    setItems((current) => [
      ...current,
      { id: `local-${Date.now()}`, videoId: video.id, timestamp: Math.round(player.current?.currentTime ?? 0), type, teamNumber: video.teamNumber, notes: "New review tag" },
    ]);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
      <Card className="p-0">
        <iframe className="aspect-video w-full rounded-t-lg" src={video.url} title={video.title} allowFullScreen />
        <video ref={player} className="hidden" />
        <div className="flex flex-wrap gap-2 p-4">
          <select value={type} onChange={(event) => setType(event.target.value)} className="h-10 rounded-md border border-[#F1E9E9]/10 bg-[#111331] px-3 text-sm text-[#F1E9E9]">
            {config.timelineEventTypes.map((item) => <option key={item}>{item}</option>)}
          </select>
          <Button onClick={addTag}><Plus className="size-4" /> Add timeline tag</Button>
        </div>
      </Card>
      <aside className="space-y-4">
        <Card>
          <div className="text-xs uppercase tracking-[0.18em] text-[#E491C9]">Generated Stats</div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <div><div className="text-2xl text-[#F1E9E9]">{generated.scored}</div><div className="text-xs text-[#F1E9E9]/50">Scores</div></div>
            <div><div className="text-2xl text-[#F1E9E9]">{generated.misses}</div><div className="text-xs text-[#F1E9E9]/50">Misses</div></div>
            <div><div className="text-2xl text-[#F1E9E9]">{generated.reliability}%</div><div className="text-xs text-[#F1E9E9]/50">Signal</div></div>
          </div>
        </Card>
        <Card>
          <div className="text-xs uppercase tracking-[0.18em] text-[#F1E9E9]/50">Timeline</div>
          <div className="mt-3 space-y-2">
            {items.map((item) => (
              <div key={item.id} className="rounded-md bg-[#F1E9E9]/5 p-3 text-sm">
                <div className="flex justify-between text-[#F1E9E9]"><span>{item.type}</span><span>{item.timestamp}s</span></div>
                <p className="mt-1 text-[#F1E9E9]/62">{item.notes}</p>
              </div>
            ))}
          </div>
        </Card>
      </aside>
    </div>
  );
}
