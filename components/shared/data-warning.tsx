import { TriangleAlert } from "lucide-react";

export function DataWarning({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div className="mb-4 flex items-start gap-3 rounded-lg border border-[#E491C9]/30 bg-[#982598]/18 p-3 text-sm text-[#F1E9E9]/84">
      <TriangleAlert className="mt-0.5 size-4 shrink-0 text-[#E491C9]" />
      <p>{message}</p>
    </div>
  );
}
