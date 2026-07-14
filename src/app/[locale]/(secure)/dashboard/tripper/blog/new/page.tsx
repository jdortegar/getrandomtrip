import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasRoleAccess } from "@/lib/auth/roleAccess";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { hasLocale } from "@/lib/i18n/config";
import { NewBlogPostShell } from "@/components/app/dashboard/tripper/blog/NewBlogPostShell";

export default async function NewBlogPostPage(props: {
  params: Promise<{ locale: string }>;
}) {
  const params = await props.params;
  const locale = hasLocale(params.locale) ? params.locale : "es";
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect(`/${locale}/login`);
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, roles: true },
  });

  if (!user || !hasRoleAccess(user, "tripper")) {
    redirect(`/${locale}/dashboard`);
  }

  const dict = await getDictionary(locale);

  return (
    <NewBlogPostShell
      dict={dict.tripperBlogs.form}
      locale={locale}
      userBadgeLabels={dict.journey.userBadge}
    />
  );
}
