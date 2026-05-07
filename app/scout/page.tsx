import { ScoutingForm } from "@/components/scouting/scouting-form";
import { PageShell } from "@/components/shared/page-shell";

export default function ScoutPage() {
  return (
    <PageShell title="Manual Scouting" eyebrow="Configurable by FTC season">
      <ScoutingForm />
    </PageShell>
  );
}
