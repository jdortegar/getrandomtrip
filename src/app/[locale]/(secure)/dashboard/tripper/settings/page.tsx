import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getTripperDashboardStats,
  getTripperReviewStats,
  getTripperSettingsExtras,
} from "@/lib/db/tripper-queries";
import { getUserProfileMe } from "@/lib/db/user-queries";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { hasLocale } from "@/lib/i18n/config";
import type { TripperSettingsStats } from "@/types/tripper";
import TripperSettingsPageClient from "./TripperSettingsPageClient";

export default async function TripperSettingsPage(props: {
  params: Promise<{ locale: string }>;
}) {
  const params = await props.params;
  const locale = hasLocale(params.locale) ? params.locale : "es";
  const dict = await getDictionary(locale);

  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  const email = session?.user?.email;

  const [extras, totalExperiences, reviewStats, dashboardStats, travelerProfile] =
    userId
      ? await Promise.all([
          getTripperSettingsExtras(userId),
          prisma.experience.count({ where: { ownerId: userId } }),
          getTripperReviewStats(userId),
          getTripperDashboardStats(userId),
          email ? getUserProfileMe(email) : Promise.resolve(null),
        ])
      : [null, 0, null, null, null];

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
      initialTravelerProfile={travelerProfile}
      locale={locale}
    />
  );
}
