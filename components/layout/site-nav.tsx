"use client";

import { BarChart3, Binoculars, Home, Trophy, Users, Video } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { currentSeason } from "@/lib/mock-data";
import { SearchBox } from "@/components/shared/search-box";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: `/seasons/${currentSeason.id}/events`, label: "Events", icon: Trophy },
  { href: `/seasons/${currentSeason.id}/teams`, label: "Teams", icon: Users },
  { href: "/compare", label: "Stats", icon: BarChart3 },
  { href: "/watch", label: "Watch", icon: Video },
  { href: "/scout", label: "Scout", icon: Binoculars },
];

export function SiteNav() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-50 border-b border-[#F1E9E9]/12 bg-[#982598] text-[#F1E9E9] shadow-[0_1px_0_rgba(0,0,0,0.18)]">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-2 px-3">
        <Link href="/" className="flex shrink-0 items-center gap-2 rounded px-2 py-2 text-lg font-bold text-[#F1E9E9] transition hover:bg-[#F1E9E9]/10">
          <span className="flex size-7 items-center justify-center">
            <Binoculars className="size-6" />
          </span>
          <span className="hidden sm:inline">
            RoboScout<span className="font-normal italic">AI</span>
          </span>
        </Link>
        <nav className="flex items-center gap-1 overflow-x-auto px-1">
          {navItems.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "flex items-center gap-2 rounded px-3 py-2 text-sm font-medium transition",
                  active ? "bg-[#F1E9E9]/16 text-[#F1E9E9]" : "text-[#F1E9E9]/82 hover:bg-[#F1E9E9]/10 hover:text-[#F1E9E9]",
                ].join(" ")}
              >
                <item.icon className="size-4" />
                <span className="hidden md:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex justify-end">
          <SearchBox compact />
        </div>
      </div>
    </header>
  );
}
