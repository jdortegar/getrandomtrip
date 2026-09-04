import { cn } from "@/lib/utils";

export default function TextPagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={cn("bg-white font-barlow text-ink")}>
      {children}
    </div>
  );
}
