import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasRoleAccess } from "@/lib/auth/roleAccess";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { hasLocale } from "@/lib/i18n/config";
import Section from "@/components/layout/Section";
import { AdminNotificationsPageClient } from "../AdminNotificationsPageClient";
import type { ClientNotification, NotificationMetadata } from "@/types/notifications";

export default async function AdminNotificationsPage(props: {
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

  if (!user || !hasRoleAccess(user, "admin")) {
    redirect(`/${params.locale}/dashboard`);
  }

  const locale = hasLocale(params.locale) ? params.locale : "es";
  const dict = await getDictionary(locale);

  const rawNotifications = await prisma.notification.findMany({
    where: {
      userId: user.id,
      audience: "ADMIN",
    },
    orderBy: { createdAt: "desc" },
  });

  const notifications: ClientNotification[] = rawNotifications.map((n) => ({
    id: n.id,
    userId: n.userId,
    type: n.type,
    audience: n.audience,
    isRead: n.isRead,
    title: n.title,
    body: n.body,
    metadata: n.metadata as NotificationMetadata,
    createdAt: n.createdAt.toISOString(),
  }));

  return (
    <Section>
      <AdminNotificationsPageClient
        copy={dict.notifications}
        initialNotifications={notifications}
        locale={locale}
      />
    </Section>
  );
}
