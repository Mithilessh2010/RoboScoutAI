import Link from "next/link";
import type { ButtonHTMLAttributes, AnchorHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "icon";
};

export function Button({ className, variant = "primary", size = "md", ...props }: ButtonProps) {
  return <button className={buttonClass({ className, variant, size })} {...props} />;
}

export function LinkButton({
  className,
  variant = "primary",
  size = "md",
  children,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; variant?: ButtonProps["variant"]; size?: ButtonProps["size"]; children: ReactNode }) {
  return (
    <Link className={buttonClass({ className, variant, size })} {...props}>
      {children}
    </Link>
  );
}

function buttonClass({ className, variant, size }: { className?: string; variant: ButtonProps["variant"]; size: ButtonProps["size"] }) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-md border text-sm font-medium transition duration-200 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#E491C9] disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
    variant === "primary" && "border-[#982598] bg-[#982598] text-[#F1E9E9] hover:border-[#B337AA] hover:bg-[#B337AA] shadow-sm shadow-black/15",
    variant === "secondary" && "border-[#E491C9]/35 bg-[#15173D]/40 text-[#F1E9E9] hover:border-[#E491C9]/70 hover:bg-[#E491C9]/10",
    variant === "ghost" && "border-transparent bg-transparent text-[#F1E9E9]/70 hover:bg-[#F1E9E9]/7 hover:text-[#F1E9E9]",
    variant === "danger" && "border-[#E491C9]/30 bg-[#982598]/20 text-[#F1E9E9] hover:bg-[#982598]/32",
    size === "sm" && "h-8 px-3",
    size === "md" && "h-10 px-4",
    size === "icon" && "size-10 p-0",
    className,
  );
}
