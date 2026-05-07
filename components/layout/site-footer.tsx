import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-12 border-t border-[#F1E9E9]/10">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-sm text-[#F1E9E9]/48 md:flex-row md:items-center md:justify-between">
        <p>Data provided by the FIRST Tech Challenge Events API where live sync is configured.</p>
        <div className="flex gap-4">
          <Link className="transition hover:text-[#E491C9]" href="/about">About data</Link>
          <a className="transition hover:text-[#E491C9]" href="https://ftc-events.firstinspires.org/services/API" target="_blank" rel="noreferrer">
            FTC Events API
          </a>
        </div>
      </div>
    </footer>
  );
}
