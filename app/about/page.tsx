import { PageShell } from "@/components/shared/page-shell";
import { Card } from "@/components/ui/card";

export default function AboutPage() {
  return (
    <PageShell title="About RoboScoutAI Data" eyebrow="Attribution">
      <Card>
        <h2 className="text-xl font-semibold text-[#F1E9E9]">FTC Events API Attribution</h2>
        <p className="mt-3 text-sm leading-6 text-[#F1E9E9]/72">
          Data provided by the FIRST Tech Challenge Events API when live sync credentials are configured. RoboScoutAI also includes mock data so the app remains usable offline or without credentials.
        </p>
        <a className="mt-4 inline-flex text-sm font-medium text-[#E491C9] hover:text-[#F1E9E9]" href="https://ftc-events.firstinspires.org/services/API" target="_blank" rel="noreferrer">
          Official FTC Events API/services page
        </a>
      </Card>
    </PageShell>
  );
}
