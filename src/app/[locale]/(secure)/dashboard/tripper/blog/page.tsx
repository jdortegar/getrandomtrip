import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { BlogPageClient } from "@/components/app/dashboard/tripper/blog/BlogPageClient";
import Section from "@/components/layout/Section";
import { authOptions } from "@/lib/auth";
import { hasRoleAccess } from "@/lib/auth/roleAccess";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { prisma } from "@/lib/prisma";

export default async function TripperBlogPage(props: {
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

  const locale = params.locale;
  const dict = await getDictionary(locale);

  return (
    <Section>
      <BlogPageClient dict={dict.tripperBlogs} locale={locale} />
    </Section>
  );
}
