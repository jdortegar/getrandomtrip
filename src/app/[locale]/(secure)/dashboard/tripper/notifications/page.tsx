import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasRoleAccess } from "@/lib/auth/roleAccess";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { hasLocale } from "@/lib/i18n/config";
import Section from "@/components/layout/Section";
import { NotificationsPageClient } from "@/components/app/dashboard/tripper/notifications/NotificationsPageClient";
import {
  NOTIFICATIONS_PAGE_SIZE,
  notificationListWhere,
  parseNotificationStatus,
  toClientNotification,
} from "@/lib/notifications/list-query";

export default async function TripperNotificationsPage(props: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
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

  const locale = hasLocale(params.locale) ? params.locale : "es";
  const dict = await getDictionary(locale);

  const sp = await props.searchParams;
  const status = parseNotificationStatus(sp.status);
  const page = Math.max(1, Number(sp.page) || 1);
  const where = notificationListWhere({ userId: user.id, audience: "TRIPPER", status });

  const [rows, total, unreadTotal] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * NOTIFICATIONS_PAGE_SIZE,
      take: NOTIFICATIONS_PAGE_SIZE,
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({
      where: notificationListWhere({ userId: user.id, audience: "TRIPPER", status: "unread" }),
    }),
  ]);

  return (
    <Section>
      <NotificationsPageClient
        audience="TRIPPER"
        copy={dict.notifications}
        initialNotifications={rows.map(toClientNotification)}
        initialPage={page}
        initialStatus={status}
        initialTotal={total}
        initialUnreadTotal={unreadTotal}
        locale={locale}
      />
    </Section>
  );
}
