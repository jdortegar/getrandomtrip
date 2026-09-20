import { Loader2 } from "lucide-react";

export default function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center h-screen" data-component="LoadingSpinner">
      <Loader2 className="w-12 h-12 animate-spin text-primary" />
    </div>
  );
}
