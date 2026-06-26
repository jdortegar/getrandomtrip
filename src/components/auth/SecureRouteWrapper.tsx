"use client";

import SecureRoute from "@/components/auth/SecureRoute";

interface Props {
  children: React.ReactNode;
  requiredRole?: "client" | "tripper" | "admin";
}

export default function SecureRouteWrapper({ children, requiredRole }: Props) {
  return <SecureRoute requiredRole={requiredRole}>{children}</SecureRoute>;
}
