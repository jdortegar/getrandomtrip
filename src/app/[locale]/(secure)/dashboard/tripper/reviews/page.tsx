import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import {
  ReviewsPageClient,
  type TripperReview,
} from "@/components/app/dashboard/tripper/reviews/ReviewsPageClient";
import Section from "@/components/layout/Section";
import { authOptions } from "@/lib/auth";
import { hasRoleAccess } from "@/lib/auth/roleAccess";
import { getTripperReviews } from "@/lib/db/tripper-queries";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function TripperReviewsPage(props: {
  params: Promise<{ locale: string }>;
}) {
  const params = await props.params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect(`/${params.locale}/login`);
  }

  const user = await prisma.user.findUnique({
    select: { id: true, roles: true },
    where: { id: session.user.id },
  });

  if (!user || !hasRoleAccess(user, "tripper")) {
    redirect(`/${params.locale}/dashboard`);
  }

  const data = await getTripperReviews(user.id);
  const dict = await getDictionary(params.locale);

  const reviews: TripperReview[] = data.reviews.map((review) => ({
    content: review.content,
    createdAt: new Date(review.createdAt).toISOString(),
    destination: review.destination,
    id: review.id,
    isPublic: review.isPublic,
    packageTitle: review.packageTitle,
    rating: review.rating,
    title: review.title,
    userAvatar: review.userAvatar,
    userName: review.userName,
  }));

  return (
    <Section>
      <ReviewsPageClient
        averageRating={data.averageRating}
        detractors={data.detractors}
        dict={dict.tripperReviews}
        locale={params.locale}
        nps={data.nps}
        promoters={data.promoters}
        reviews={reviews}
        totalReviews={data.totalReviews}
      />
    </Section>
  );
}
