import Link from "next/link";
import type { Event } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { Table, Td, Th } from "@/components/ui/table";

export function EventTable({ events }: { events: Event[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-[#F1E9E9]/10 bg-[#111331]/38">
      <Table>
        <thead>
          <tr>
            <Th>Event</Th>
            <Th>Code</Th>
            <Th>Location</Th>
            <Th>Dates</Th>
            <Th>Teams</Th>
          </tr>
        </thead>
        <tbody>
          {events.map((event) => (
            <tr key={event.code}>
              <Td>
                <Link className="font-medium text-[#E491C9] transition hover:text-[#F1E9E9]" href={`/seasons/${event.season}/events/${event.code}`}>
                  {event.name}
                </Link>
              </Td>
              <Td className="font-mono">{event.code}</Td>
              <Td>{event.city}, {event.state}</Td>
              <Td>{formatDate(event.startDate)} - {formatDate(event.endDate)}</Td>
              <Td>{event.teamNumbers.length}</Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
