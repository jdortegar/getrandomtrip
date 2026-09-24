import { dashboardPageMetadata } from "@/lib/dashboard/pageMetadata";

// Client page below can't export metadata — this layout gives it a distinct title.
export const generateMetadata = dashboardPageMetadata("/dashboard/tripper/blog/x");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
