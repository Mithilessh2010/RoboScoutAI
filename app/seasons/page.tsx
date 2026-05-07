import { PageShell } from "@/components/shared/page-shell";
import { DataWarning } from "@/components/shared/data-warning";
import { Card } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/button";
import { seasons } from "@/lib/mock-data";
import { getLiveApiIndex } from "@/lib/ftc-events/page-data";

export default async function SeasonsPage() {
  const apiIndex = await getLiveApiIndex();
  const currentSeason = typeof apiIndex.data === "object" && apiIndex.data && "currentSeason" in apiIndex.data ? Number((apiIndex.data as { currentSeason?: number }).currentSeason) : undefined;
  const maxSeason = typeof apiIndex.data === "object" && apiIndex.data && "maxSeason" in apiIndex.data ? Number((apiIndex.data as { maxSeason?: number }).maxSeason) : undefined;
  return (
    <PageShell title="Seasons" eyebrow="Historical FTC data">
      <DataWarning message={apiIndex.warning} />
      {currentSeason || maxSeason ? <p className="mb-4 text-sm text-[#F1E9E9]/62">FTC index available{currentSeason ? ` · current season ${currentSeason}` : ""}{maxSeason ? ` · max season ${maxSeason}` : ""}.</p> : null}
      <div className="grid gap-4 md:grid-cols-3">
        {seasons.map((season) => (
          <Card key={season.id}>
            <div className="text-xs uppercase tracking-[0.18em] text-[#E491C9]">{season.name}</div>
            <h2 className="mt-3 text-2xl font-semibold text-[#F1E9E9]">{season.gameName}</h2>
            <p className="mt-2 text-sm text-[#F1E9E9]/62">Kickoff {season.kickoff}</p>
            <LinkButton className="mt-5" href={`/seasons/${season.id}`} variant="secondary">Open season</LinkButton>
          </Card>
        ))}
      </div>
    </PageShell>
  );
}
