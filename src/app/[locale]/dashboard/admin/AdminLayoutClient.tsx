"use client";

import SecureRoute from "@/components/auth/SecureRoute";
import { AdminSidebar } from "@/components/app/admin/AdminSidebar";

export default function AdminLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SecureRoute requiredRole="admin">
      <div className="flex h-screen">
        <AdminSidebar />
        <main className="min-h-0 min-w-0 flex-1 overflow-auto px-4 py-6 md:px-6">
          {children}
        </main>
      </div>
    </SecureRoute>
  );
}
