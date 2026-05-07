import type { Match } from "@/lib/types";
import { getWinner } from "@/lib/stats/matchUtils";
import { Table, Td, Th } from "@/components/ui/table";

export function MatchTable({ matches }: { matches: Match[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-[#F1E9E9]/10 bg-[#111331]/38">
      <Table>
        <thead>
          <tr>
            <Th>Match</Th>
            <Th>Red</Th>
            <Th>Blue</Th>
            <Th>Score</Th>
            <Th>Winner</Th>
          </tr>
        </thead>
        <tbody>
          {matches.map((match) => (
            <tr key={match.id}>
              <Td>QM{match.matchNumber}</Td>
              <Td className="text-[#E491C9]">{match.red.teams.join(" / ")}</Td>
              <Td className="text-[#F1E9E9]/78">{match.blue.teams.join(" / ")}</Td>
              <Td>{match.status === "complete" ? `${match.red.score} - ${match.blue.score}` : "Scheduled"}</Td>
              <Td className="capitalize">{getWinner(match)}</Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
