import { AlertCircle, Check, Loader2 } from "lucide-react";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

interface XsedSaveIndicatorProps {
  labels: { error: string; saved: string; saving: string };
  status: SaveStatus;
}

export function XsedSaveIndicator({ labels, status }: XsedSaveIndicatorProps) {
  if (status === "idle") return null;
  return (
    <div className="flex items-center gap-1.5 text-gray-400 text-xs">
      {status === "saving" && <Loader2 className="h-3 w-3 animate-spin" />}
      {status === "saved" && <Check className="h-3 w-3 text-green-500" />}
      {status === "error" && <AlertCircle className="h-3 w-3 text-red-400" />}
      <span>
        {status === "saving" && labels.saving}
        {status === "saved" && labels.saved}
        {status === "error" && labels.error}
      </span>
    </div>
  );
}
