"use client";

import { useRouter } from "next/navigation";
import { seasons } from "@/lib/mock-data";

export function SeasonSwitcher({ season }: { season: string }) {
  const router = useRouter();
  return (
    <select
      className="rs-input h-10 rounded-md px-3 text-sm"
      value={season}
      onChange={(event) => router.push(`/seasons/${event.target.value}`)}
    >
      {seasons.map((item) => (
        <option key={item.id} value={item.id}>
          {item.name} {item.gameName}
        </option>
      ))}
    </select>
  );
}
