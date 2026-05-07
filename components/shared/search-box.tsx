"use client";

import { CalendarDays, Hash, Search, X } from "lucide-react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { currentSeason } from "@/lib/mock-data";

type SearchResult = {
  href: string;
  label: string;
  meta: string;
  type: "Team" | "Event" | "Season";
};

type SearchBoxProps = {
  compact?: boolean;
  season?: string;
};

const resultIcons = {
  Team: Hash,
  Event: CalendarDays,
  Season: CalendarDays,
};

export function SearchBox({ compact = false, season = currentSeason.id }: SearchBoxProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const trimmedQuery = query.trim();

  useEffect(() => {
    function onDocumentKeyDown(event: KeyboardEvent) {
      if (event.key !== "/" || event.ctrlKey || event.metaKey || event.altKey) return;
      const target = event.target instanceof HTMLElement ? event.target.tagName : "";
      if (/^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(target)) return;
      event.preventDefault();
      inputRef.current?.focus();
      setOpen(true);
    }

    function onDocumentPointerDown(event: PointerEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    }

    document.addEventListener("keydown", onDocumentKeyDown);
    document.addEventListener("pointerdown", onDocumentPointerDown);
    return () => {
      document.removeEventListener("keydown", onDocumentKeyDown);
      document.removeEventListener("pointerdown", onDocumentPointerDown);
    };
  }, []);

  useEffect(() => {
    if (!trimmedQuery) return;

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(trimmedQuery)}&season=${encodeURIComponent(season)}`, {
          signal: controller.signal,
        });
        const data = (await response.json()) as { results?: SearchResult[] };
        setResults(data.results ?? []);
        setActiveIndex(0);
      } catch {
        if (!controller.signal.aborted) setResults([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 120);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [season, trimmedQuery]);

  const displayedResults = useMemo(() => {
    if (!/^\d+$/.test(trimmedQuery) || trimmedQuery.length < 2) return results;
    const directTeam: SearchResult = {
      href: `/seasons/${season}/teams/${Number(trimmedQuery)}`,
      label: `${Number(trimmedQuery)} - FTC Team`,
      meta: "Team number lookup",
      type: "Team",
    };
    return [directTeam, ...results.filter((result) => result.href !== directTeam.href)].slice(0, 10);
  }, [results, season, trimmedQuery]);

  const selectedResult = displayedResults[Math.max(0, Math.min(activeIndex, displayedResults.length - 1))];

  function closeSearch() {
    setQuery("");
    setOpen(false);
    setResults([]);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (/^\d+$/.test(trimmedQuery)) {
      router.push(`/seasons/${season}/teams/${Number(trimmedQuery)}`);
      closeSearch();
      return;
    }
    if (!selectedResult) return;
    router.push(selectedResult.href);
    closeSearch();
  }

  return (
    <div ref={wrapperRef} className={compact ? "relative w-[260px] max-w-[42vw] focus-within:w-[min(600px,52vw)] max-[860px]:w-[44px] max-[860px]:focus-within:w-[calc(100vw-1.5rem)]" : "relative w-full max-w-2xl"}>
      <form
        onSubmit={submit}
        className={[
          "group relative flex items-center border border-[#F1E9E9]/22 bg-[#15173D]/18 transition-all duration-300",
          "focus-within:bg-[#F1E9E9] focus-within:text-[#15173D]",
          trimmedQuery && open ? "rounded-t border-b-transparent shadow-[0_6px_16px_rgba(0,0,0,0.16)]" : "rounded",
        ].join(" ")}
      >
        <Search className={compact ? "ml-3 size-4 shrink-0 text-[#F1E9E9]/76 group-focus-within:text-[#15173D]/58" : "ml-4 size-5 shrink-0 text-[#F1E9E9]/70 group-focus-within:text-[#15173D]/58"} />
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => {
            const nextQuery = event.target.value;
            setQuery(nextQuery);
            if (!nextQuery.trim()) {
              setResults([]);
              setLoading(false);
            }
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setActiveIndex((index) => Math.min(displayedResults.length - 1, index + 1));
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setActiveIndex((index) => Math.max(0, index - 1));
            } else if (event.key === "Escape") {
              inputRef.current?.blur();
              setOpen(false);
            }
          }}
          placeholder="Search for teams and events"
          className={[
            "w-full border-0 bg-transparent text-sm text-[#F1E9E9] outline-none",
            "placeholder:text-[#F1E9E9]/64 focus:text-[#15173D] focus:placeholder:text-[#15173D]/50",
            compact ? "h-9 px-2 max-[860px]:w-0 max-[860px]:focus:w-full" : "h-12 px-3",
          ].join(" ")}
          type="search"
          autoComplete="off"
        />
        {query ? (
          <button type="button" onClick={closeSearch} className="mr-2 rounded px-2 py-1 text-[#15173D]/60 transition hover:bg-[#15173D]/8 hover:text-[#15173D]" aria-label="Clear search">
            <X className="size-4" />
          </button>
        ) : null}
        <span className="mr-3 rounded border border-[#F1E9E9]/35 px-1.5 text-xs leading-5 text-[#F1E9E9]/72 group-focus-within:hidden">/</span>
      </form>

      {open && trimmedQuery ? (
        <div className="absolute left-0 right-0 top-full z-50 max-h-[350px] overflow-y-auto rounded-b border border-t-0 border-[#F1E9E9]/22 bg-[#F1E9E9] p-2 text-[#15173D] shadow-[0_8px_18px_rgba(0,0,0,0.18)]">
          {loading && displayedResults.length === 0 ? (
            <div className="space-y-2 p-2">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="h-9 animate-pulse rounded bg-[#15173D]/8" />
              ))}
            </div>
          ) : displayedResults.length ? (
            <ul className="space-y-1">
              {displayedResults.map((item, index) => {
                const Icon = resultIcons[item.type];
                const active = index === activeIndex;
                return (
                  <li key={`${item.type}-${item.href}`}>
                    <Link
                      href={item.href}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={closeSearch}
                      className={["grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded px-3 py-2 text-sm text-[#15173D] transition", active ? "bg-[#15173D]/10" : "hover:bg-[#15173D]/7"].join(" ")}
                    >
                      <Icon className="size-4 text-[#982598]" />
                      <span className="truncate font-semibold">{item.label}</span>
                      <span className="truncate text-xs italic text-[#15173D]/60">{item.meta}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="px-3 py-4 text-sm font-semibold text-[#15173D]/70">No Results</div>
          )}
        </div>
      ) : null}
    </div>
  );
}
