export const dynamic = "force-dynamic";

import SecureRouteWrapper from "@/components/auth/SecureRouteWrapper";
import { TripperPageHeading } from "@/components/app/dashboard/tripper/TripperPageHeading";
import { TripperNavTabs } from "@/components/app/dashboard/tripper/TripperNavTabs";

export default function TripperLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SecureRouteWrapper requiredRole="tripper">
      <>
        <div className="bg-neutral-50 pt-16 pb-10">
          <div className="rt-container">
            <TripperPageHeading />
          </div>
          <div className="rt-container">
            <TripperNavTabs />
          </div>
        </div>
        {children}
      </>
    </SecureRouteWrapper>
  );
}
