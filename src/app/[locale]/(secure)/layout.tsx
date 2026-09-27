import type { Metadata } from "next";
import SecureRouteWrapper from "@/components/auth/SecureRouteWrapper";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  description: "Tu panel personal de viajes",
  title: { default: "Dashboard - Randomtrip", template: "%s - Randomtrip" },
};

export default function SecureLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SecureRouteWrapper>{children}</SecureRouteWrapper>;
}
