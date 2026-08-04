import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { ReviewsPageClient } from "@/components/app/dashboard/tripper/reviews/ReviewsPageClient";
import Section from "@/components/layout/Section";
import { authOptions } from "@/lib/auth";
import { hasRoleAccess } from "@/lib/auth/roleAccess";
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

  const dict = await getDictionary(params.locale);

  return (
    <Section>
      <ReviewsPageClient dict={dict.tripperReviews} locale={params.locale} />
    </Section>
  );
}
