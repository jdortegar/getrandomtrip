import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasRoleAccess } from "@/lib/auth/roleAccess";
import { getDictionary } from "@/lib/i18n/dictionaries";
import Section from "@/components/layout/Section";
import ExperienceFormClient from "@/components/app/dashboard/tripper/experiences/ExperienceFormClient";

export default async function NewPackagePage({
  params,
}: {
  params: { locale: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect(`/${params.locale}/login`);
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, roles: true },
  });

  if (!user || !hasRoleAccess(user, "tripper")) {
    redirect(`/${params.locale}/dashboard`);
  }

  const dict = await getDictionary(params.locale);
  

  return (
    <Section>
      <ExperienceFormClient
        dict={dict.packages.form}
        mode="create"
        locale={params.locale}
      />
    </Section>
  );
}
