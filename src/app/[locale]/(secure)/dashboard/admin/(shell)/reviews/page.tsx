import { AdminReviewsPageClient } from "../../AdminReviewsPageClient";
import { NeedsDesignBanner } from "@/components/common/NeedsDesignBanner";

export default function AdminReviewsPage() {
  return (
    <>
      <NeedsDesignBanner />
      <AdminReviewsPageClient />
    </>
  );
}
