import type { ReactNode } from "react";
import { MotionPage } from "./motion";

export function PageShell({ title, eyebrow, children, actions }: { title: string; eyebrow?: string; children: ReactNode; actions?: ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8">
      <MotionPage>
        <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            {eyebrow ? <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#E491C9]">{eyebrow}</p> : null}
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.02em] text-[#F1E9E9] md:text-5xl">{title}</h1>
          </div>
          {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
        </div>
        {children}
      </MotionPage>
    </main>
  );
}
