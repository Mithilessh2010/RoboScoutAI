import Link from "next/link";
import type { Match } from "@/lib/types";
import { calculateOpr } from "@/lib/stats/opr";
import { getTeam } from "@/lib/mock-data";
import { Table, Td, Th } from "@/components/ui/table";

export function OprTable({ matches }: { matches: Match[] }) {
  const rows = calculateOpr(matches);
  return (
    <div className="overflow-x-auto rounded-lg border border-[#F1E9E9]/10 bg-[#111331]/38">
      <Table>
        <thead>
          <tr>
            <Th>Rank</Th>
            <Th>Team</Th>
            <Th>OPR</Th>
            <Th>Auto</Th>
            <Th>TeleOp</Th>
            <Th>Endgame</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.teamNumber}>
              <Td>{index + 1}</Td>
              <Td>
                <Link className="font-medium text-[#E491C9] transition hover:text-[#F1E9E9]" href={`/teams/${row.teamNumber}`}>
                  {row.teamNumber} {getTeam(row.teamNumber)?.name}
                </Link>
              </Td>
              <Td>{row.opr.toFixed(1)}</Td>
              <Td>{row.autoOpr.toFixed(1)}</Td>
              <Td>{row.teleopOpr.toFixed(1)}</Td>
              <Td>{row.endgameOpr.toFixed(1)}</Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
