"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, TriangleAlert } from "lucide-react";
import { Card } from "@/components/ui/card";
import { fetchFtcApiIndex } from "@/lib/data/ftc-client";

type Status =
  | { state: "loading" }
  | { state: "connected"; currentSeason?: number; maxSeason?: number }
  | { state: "missing" | "unauthorized" | "unavailable" | "unknown"; message: string };

export function FtcApiStatus() {
  const [status, setStatus] = useState<Status>({ state: "loading" });

  useEffect(() => {
    let cancelled = false;
    fetchFtcApiIndex<unknown>()
      .then((json) => {
        if (cancelled) return;
        if (json.ok) {
          const data = json.data as { currentSeason?: number; maxSeason?: number } | undefined;
          setStatus({ state: "connected", currentSeason: data?.currentSeason, maxSeason: data?.maxSeason });
          return;
        }
        const code = json.error.code;
        setStatus({
          state: code === "MISSING_CREDENTIALS" ? "missing" : code === "UNAUTHORIZED" ? "unauthorized" : code === "SERVICE_UNAVAILABLE" ? "unavailable" : "unknown",
          message: json.error.message ?? "Unknown FTC Events API error.",
        });
      })
      .catch((error) => {
        if (!cancelled) setStatus({ state: "unknown", message: error instanceof Error ? error.message : "Unknown FTC Events API error." });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const connected = status.state === "connected";
  return (
    <Card>
      <div className="flex items-start gap-3">
        {connected ? <ShieldCheck className="mt-1 size-6 text-[#E491C9]" /> : <TriangleAlert className="mt-1 size-6 text-[#E491C9]" />}
        <div>
          <h2 className="text-xl font-semibold text-[#F1E9E9]">Official FTC Events API Status</h2>
          <p className="mt-2 text-sm text-[#F1E9E9]/68">
            {status.state === "loading"
              ? "Checking connection..."
              : connected
                ? `Connected${status.currentSeason ? ` · current season ${status.currentSeason}` : ""}${status.maxSeason ? ` · max season ${status.maxSeason}` : ""}`
                : status.message}
          </p>
        </div>
      </div>
    </Card>
  );
}
