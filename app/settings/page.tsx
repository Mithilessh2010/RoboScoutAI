import { PageShell } from "@/components/shared/page-shell";
import { FtcApiStatus } from "@/components/settings/FtcApiStatus";
import { FtcApiAdmin } from "@/components/settings/ftc-api-admin";
import { Card } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <PageShell title="Settings" eyebrow="Configuration">
      <div className="grid gap-4 md:grid-cols-2">
        <Card><h2 className="text-xl font-semibold text-[#F1E9E9]">Theme</h2><p className="mt-2 text-sm text-[#F1E9E9]/62">Dark robotics theme is enabled for the MVP. Theme controls are scaffolded.</p></Card>
        <Card><h2 className="text-xl font-semibold text-[#F1E9E9]">Data Sources</h2><p className="mt-2 text-sm text-[#F1E9E9]/62">Official FTC Events API is used when `FTC_EVENTS_USERNAME` and `FTC_EVENTS_AUTH_KEY` are configured. Mock data stays available as fallback.</p></Card>
        <Card><h2 className="text-xl font-semibold text-[#F1E9E9]">OpenRouter</h2><p className="mt-2 text-sm text-[#F1E9E9]/62">Create `.env.local` with `OPENROUTER_API_KEY=` to enable `/api/ai/chat`.</p></Card>
        <Card><h2 className="text-xl font-semibold text-[#F1E9E9]">Season Configuration</h2><p className="mt-2 text-sm text-[#F1E9E9]/62">DECODE config lives in `lib/game-config/2025-2026-decode.ts`; past seasons fall back to generic configurable scouting categories.</p></Card>
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <FtcApiStatus />
        <Card>
          <h2 className="text-xl font-semibold text-[#F1E9E9]">FTC Events API Setup</h2>
          <div className="mt-3 space-y-2 text-sm leading-6 text-[#F1E9E9]/68">
            <p>Add these to `.env.local`, then restart `npm run dev`:</p>
            <pre className="overflow-auto rounded-md bg-[#111331] p-3 text-xs text-[#F1E9E9]">{`FTC_EVENTS_USERNAME=your_username_here
FTC_EVENTS_AUTH_KEY=your_authorization_key_here
FTC_EVENTS_API_BASE_URL=https://ftc-api.firstinspires.org/v2.0`}</pre>
            <p>Test with `/api/ftc/index` and `/api/ftc/teams?season=2025&page=1`.</p>
          </div>
        </Card>
      </div>
      <div className="mt-6">
        <FtcApiAdmin />
      </div>
    </PageShell>
  );
}
