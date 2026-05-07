"use client";

import { useState } from "react";
import { Save } from "lucide-react";
import { events, currentSeason } from "@/lib/mock-data";
import { getGameConfig } from "@/lib/game-config";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function ScoutingForm() {
  const [season, setSeason] = useState(currentSeason.id);
  const config = getGameConfig(season);
  return (
    <Card>
      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Season"><input value={season} onChange={(event) => setSeason(event.target.value)} /></Field>
        <Field label="Event"><select>{events.filter((event) => event.season === season).map((event) => <option key={event.code}>{event.code}</option>)}</select></Field>
        <Field label="Match"><input type="number" defaultValue={1} /></Field>
        <Field label="Team"><input type="number" defaultValue={8644} /></Field>
        <Field label="Alliance"><select><option>red</option><option>blue</option></select></Field>
        <Field label="Robot disabled?"><select><option>No</option><option>Yes</option></select></Field>
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {Object.entries(config.scoutingCategories).map(([group, options]) => (
          <div key={group} className="rounded-lg border border-[#F1E9E9]/10 p-4">
            <div className="mb-3 text-sm font-semibold capitalize text-[#F1E9E9]">{group}</div>
            <div className="space-y-2">
              {options.map((option) => (
                <label key={option} className="flex items-center gap-2 text-sm text-[#F1E9E9]/72">
                  <input type="checkbox" className="accent-[#982598]" /> {option}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-4">
        {["Driver skill", "Reliability", "Defense", "Overall"].map((label) => (
          <Field key={label} label={label}><input type="range" min={1} max={5} defaultValue={4} /></Field>
        ))}
      </div>
      <Field className="mt-4" label="Freeform notes"><textarea rows={5} placeholder="What actually happened on the field?" /></Field>
      <Button className="mt-4"><Save className="size-4" /> Save report</Button>
    </Card>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={className}>
      <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-[#F1E9E9]/50">{label}</span>
      <div className="[&_input]:h-10 [&_input]:w-full [&_input]:rounded-md [&_input]:border [&_input]:border-[#F1E9E9]/10 [&_input]:bg-[#111331] [&_input]:px-3 [&_input]:text-[#F1E9E9] [&_select]:h-10 [&_select]:w-full [&_select]:rounded-md [&_select]:border [&_select]:border-[#F1E9E9]/10 [&_select]:bg-[#111331] [&_select]:px-3 [&_select]:text-[#F1E9E9] [&_textarea]:w-full [&_textarea]:rounded-md [&_textarea]:border [&_textarea]:border-[#F1E9E9]/10 [&_textarea]:bg-[#111331] [&_textarea]:p-3 [&_textarea]:text-[#F1E9E9]">{children}</div>
    </label>
  );
}
