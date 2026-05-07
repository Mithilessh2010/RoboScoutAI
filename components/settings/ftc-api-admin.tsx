"use client";

import { useEffect, useState } from "react";
import { RefreshCw, ShieldCheck, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type Status = {
  configured: boolean;
  baseUrl: string;
  usernameConfigured: boolean;
  tokenConfigured: boolean;
  lastSync?: {
    scope: string;
    status: string;
    message: string;
    createdAt: string;
  };
};

export function FtcApiAdmin() {
  const [status, setStatus] = useState<Status | undefined>();
  const [season, setSeason] = useState("2025");
  const [eventCode, setEventCode] = useState("");
  const [log, setLog] = useState<string[]>([]);
  const [syncing, setSyncing] = useState<string | undefined>();

  async function loadStatus() {
    const response = await fetch("/api/ftc/status");
    setStatus(await response.json());
  }

  async function sync(scope: string) {
    setSyncing(scope);
    const response = await fetch("/api/ftc/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scope, season, eventCode }),
    });
    const json = await response.json();
    setLog((items) => [`${scope}: ${json.error ?? json.warning ?? json.source ?? json.status ?? "done"}`, ...items].slice(0, 8));
    await loadStatus();
    setSyncing(undefined);
  }

  useEffect(() => {
    let cancelled = false;
    fetch("/api/ftc/status")
      .then((response) => response.json())
      .then((json) => {
        if (!cancelled) setStatus(json);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Card>
      <div className="flex items-start gap-3">
        {status?.configured ? <ShieldCheck className="mt-1 size-6 text-emerald-300" /> : <TriangleAlert className="mt-1 size-6 text-amber-300" />}
        <div>
          <h2 className="text-xl font-semibold text-[#F1E9E9]">FTC Events API</h2>
          <p className="mt-2 text-sm leading-6 text-[#F1E9E9]/62">
            {status?.configured
              ? "Credentials are configured server-side. Browser requests use RoboScoutAI proxy routes only."
              : "FTC Events API credentials are not configured. The app is using mock data fallback."}
          </p>
        </div>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <Info label="Base URL" value={status?.baseUrl ?? "Checking..."} />
        <Info label="Username" value={status?.usernameConfigured ? "Configured" : "Missing"} />
        <Info label="Auth key" value={status?.tokenConfigured ? "Configured server-side" : "Missing"} />
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <label>
          <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-[#F1E9E9]/50">Season year</span>
          <input value={season} onChange={(event) => setSeason(event.target.value)} className="h-10 w-full rounded-md border border-[#F1E9E9]/10 bg-[#111331] px-3 text-sm text-[#F1E9E9]" />
        </label>
        <label>
          <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-[#F1E9E9]/50">Event code</span>
          <input value={eventCode} onChange={(event) => setEventCode(event.target.value)} className="h-10 w-full rounded-md border border-[#F1E9E9]/10 bg-[#111331] px-3 text-sm text-[#F1E9E9]" />
        </label>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        {["seasons", "teams", "events", "matches", "rankings", "awards"].map((scope) => (
          <Button key={scope} variant="secondary" onClick={() => sync(scope)} disabled={Boolean(syncing)}>
            <RefreshCw className="size-4" /> {syncing === scope ? "Syncing..." : `Sync ${scope}`}
          </Button>
        ))}
      </div>
      <div className="mt-5 rounded-md border border-[#F1E9E9]/10 bg-[#111331]/64 p-3 text-sm text-[#F1E9E9]/72">
        <div className="font-medium text-[#F1E9E9]">Last sync</div>
        <div className="mt-1">{status?.lastSync ? `${status.lastSync.scope} · ${status.lastSync.status} · ${status.lastSync.createdAt}` : "No sync logs yet."}</div>
        <div className="mt-3 space-y-1">{log.map((line) => <div key={line}>{line}</div>)}</div>
      </div>
    </Card>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-[#F1E9E9]/5 p-3">
      <div className="text-xs uppercase tracking-[0.18em] text-[#F1E9E9]/50">{label}</div>
      <div className="mt-1 text-sm text-[#F1E9E9]/84">{value}</div>
    </div>
  );
}
