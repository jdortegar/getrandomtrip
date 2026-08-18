import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import Section from "@/components/layout/Section";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasRoleAccess } from "@/lib/auth/roleAccess";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { hasLocale } from "@/lib/i18n/config";
import { parseTripperPriceOverrides } from "@/lib/pricing/tripper-price-overrides";
import { AdminUserEditPageClient } from "./AdminUserEditPageClient";

export default async function AdminUserEditPage(props: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const params = await props.params;
  const locale = hasLocale(params.locale) ? params.locale : "es";
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect(`/${locale}/login`);
  }

  const caller = await prisma.user.findUnique({
    select: { id: true, roles: true },
    where: { id: session.user.id },
  });

  if (!caller || !hasRoleAccess(caller, "admin")) {
    redirect(`/${locale}/dashboard`);
  }

  const target = await prisma.user.findUnique({
    select: {
      commission: true,
      email: true,
      id: true,
      name: true,
      roles: true,
      tripperPriceOverrides: true,
    },
    where: { id: params.id },
  });

  if (!target) notFound();

  const dict = await getDictionary(locale);

  return (
    <Section className="py-10!">
      <div className="rt-container text-left">
        <AdminUserEditPageClient
          copy={dict.adminUsers.editPage}
          locale={locale}
          user={{
            commission: target.commission,
            id: target.id,
            name: target.name,
            roles: target.roles,
            tripperPriceOverrides: parseTripperPriceOverrides(
              target.tripperPriceOverrides,
            ),
          }}
        />
      </div>
    </Section>
  );
}
