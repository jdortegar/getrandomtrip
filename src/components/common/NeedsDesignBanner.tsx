import { Paintbrush } from "lucide-react";

export function NeedsDesignBanner() {
  return (
    <div className="flex items-center gap-2 bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs font-medium text-amber-700">
      <Paintbrush className="h-3.5 w-3.5 shrink-0" />
      <span>Needs Design — this page is functional but has not been designed yet.</span>
    </div>
  );
}
