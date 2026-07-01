import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { EarningsPageClient } from "@/components/app/dashboard/tripper/earnings/EarningsPageClient";
import Section from "@/components/layout/Section";
import { authOptions } from "@/lib/auth";
import { hasRoleAccess } from "@/lib/auth/roleAccess";
import { getTripperEarnings } from "@/lib/db/tripper-queries";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { prisma } from "@/lib/prisma";
import type { Earning } from "@/types/tripper";

export const dynamic = "force-dynamic";

export default async function TripperEarningsPage(props: {
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

  const earnings = (await getTripperEarnings(user.id, 6)) as Earning[];
  const dict = await getDictionary(params.locale);

  return (
    <Section>
      <EarningsPageClient
        dict={dict.tripperEarnings}
        earnings={earnings}
        locale={params.locale}
      />
    </Section>
  );
}
