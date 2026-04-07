"use client";

import SecureRoute from "@/components/auth/SecureRoute";
import HeaderHero from "@/components/journey/HeaderHero";
import { AdminSidebar } from "@/components/app/admin/AdminSidebar";

export default function AdminLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SecureRoute requiredRole="admin">
      <HeaderHero
        className="!h-[40vh]"
        description="Manage all trip requests, assign revealed destination and update request status."
        fallbackImage="/images/hero-image-1.jpeg"
        subtitle="ADMIN DASHBOARD"
        title="Trip Requests"
        videoSrc="/videos/hero-video-1.mp4"
      />
      <div className="flex h-screen">
        <AdminSidebar />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </SecureRoute>
  );
}
