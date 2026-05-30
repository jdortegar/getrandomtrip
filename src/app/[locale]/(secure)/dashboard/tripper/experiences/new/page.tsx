import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasRoleAccess } from "@/lib/auth/roleAccess";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { NewExperienceShell } from "@/components/app/dashboard/tripper/experiences/NewExperienceShell";

export default async function NewExperiencePage(props: {
  params: Promise<{ locale: string }>;
}) {
  const params = await props.params;
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
    <NewExperienceShell
      dict={dict.tripperExperiences.form}
      locale={params.locale}
      userBadgeLabels={dict.journey.userBadge}
    />
  );
}
