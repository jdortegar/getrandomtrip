import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserProfileMe } from "@/lib/db/user-queries";
import {
  getTripperDashboardStats,
  getTripperReviewStats,
  getTripperSettingsExtras,
} from "@/lib/db/tripper-queries";
import { prisma } from "@/lib/prisma";
import Section from "@/components/layout/Section";
import { AccountSettingsPanel } from "@/components/app/account/AccountSettingsPanel";
import TripperSettingsPageClient from "@/app/[locale]/(secure)/dashboard/tripper/settings/TripperSettingsPageClient";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { hasLocale } from "@/lib/i18n/config";
import type { TripperSettingsStats } from "@/types/tripper";

export default async function TravelerSettingsPage(props: {
  params: Promise<{ locale: string }>;
}) {
  const params = await props.params;
  const locale = hasLocale(params.locale) ? params.locale : "es";
  const dict = await getDictionary(locale);
  const copy = dict.travelerDashboard.settingsProfile;

  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  const email = session?.user?.email;
  const initialProfile = email ? await getUserProfileMe(email) : null;

  // A traveler who is also a tripper gets the same role toggle the tripper
  // settings page has, so they can flip to their tripper profile without
  // leaving this page.
  const isAlsoTripper = initialProfile?.roles.includes("tripper") ?? false;

  if (isAlsoTripper && userId) {
    const [extras, totalExperiences, reviewStats, dashboardStats] =
      await Promise.all([
        getTripperSettingsExtras(userId),
        prisma.experience.count({ where: { ownerId: userId } }),
        getTripperReviewStats(userId),
        getTripperDashboardStats(userId),
      ]);

    const initialStats: TripperSettingsStats = {
      averageRating: reviewStats?.averageRating ?? 0,
      totalBookings: dashboardStats?.totalBookings ?? 0,
      totalExperiences,
      totalReviews: reviewStats?.totalReviews ?? 0,
    };

    return (
      <TripperSettingsPageClient
        initialDict={dict}
        initialExtras={extras}
        initialStats={initialStats}
        initialTravelerProfile={initialProfile}
        initialViewMode="traveler"
        locale={locale}
      />
    );
  }

  return (
    <Section className="py-10!">
      <div className="rt-container text-left">
        <div className="space-y-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              {copy.eyebrow}
            </p>
            <h1 className="mt-1.5 font-barlow-condensed text-3xl font-extrabold uppercase leading-none text-ink">
              {copy.heading}
            </h1>
          </div>
          <AccountSettingsPanel initialProfile={initialProfile} role="traveler" />
        </div>
      </div>
    </Section>
  );
}
