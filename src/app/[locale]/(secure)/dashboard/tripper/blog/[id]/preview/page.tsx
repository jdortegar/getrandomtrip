"use client";

import SecureRoute from "@/components/auth/SecureRoute";
import { TripperBlogPreviewClient } from "@/components/tripper/blog/TripperBlogPreviewClient";

export default function TripperBlogPreviewPage() {
  return (
    <SecureRoute requiredRole="tripper">
      <TripperBlogPreviewClient />
    </SecureRoute>
  );
}
