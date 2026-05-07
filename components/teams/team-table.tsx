import Link from "next/link";
import type { Team } from "@/lib/types";
import { Table, Td, Th } from "@/components/ui/table";

export function TeamTable({ teams, season }: { teams: Team[]; season: string }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-[#F1E9E9]/10 bg-[#111331]/38">
      <Table>
        <thead>
          <tr>
            <Th>Team</Th>
            <Th>Name</Th>
            <Th>Location</Th>
            <Th>Rookie</Th>
          </tr>
        </thead>
        <tbody>
          {teams.map((team) => (
            <tr key={team.number}>
              <Td>
                <Link className="font-medium text-[#E491C9] transition hover:text-[#F1E9E9]" href={`/seasons/${season}/teams/${team.number}`}>
                  {team.number}
                </Link>
              </Td>
              <Td>{team.name}</Td>
              <Td>{team.city}, {team.state}</Td>
              <Td>{team.rookieYear}</Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
