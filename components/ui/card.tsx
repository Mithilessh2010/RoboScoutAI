import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "group rounded-lg border border-[#F1E9E9]/10 bg-[#1B1D4B]/78 p-5 shadow-[0_18px_50px_rgba(7,8,28,0.22)] transition duration-200 ease-out hover:-translate-y-0.5 hover:border-[#E491C9]/30 hover:bg-[#202257]/82",
        className,
      )}
      {...props}
    />
  );
}

export function MetricCard({ label, value, detail }: { label: string; value: string | number; detail?: string }) {
  return (
    <Card className="p-4">
      <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#F1E9E9]/52">{label}</div>
      <div className="mt-2 text-2xl font-semibold tabular-nums text-[#F1E9E9]">{value}</div>
      {detail ? <div className="mt-1 text-sm text-[#F1E9E9]/62">{detail}</div> : null}
    </Card>
  );
}
