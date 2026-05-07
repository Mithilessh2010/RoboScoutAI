import type { HTMLAttributes, ThHTMLAttributes, TdHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Table({ className, ...props }: HTMLAttributes<HTMLTableElement>) {
  return <table className={cn("w-full border-collapse text-sm [&_tbody_tr]:transition-colors [&_tbody_tr:hover]:bg-[#E491C9]/7", className)} {...props} />;
}

export function Th({ className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return <th className={cn("border-b border-[#F1E9E9]/10 px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-[#F1E9E9]/54", className)} {...props} />;
}

export function Td({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn("border-b border-[#F1E9E9]/7 px-3 py-2.5 text-[#F1E9E9]/84", className)} {...props} />;
}
