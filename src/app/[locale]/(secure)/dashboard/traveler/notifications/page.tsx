import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { hasLocale } from "@/lib/i18n/config";
import Section from "@/components/layout/Section";
import { TravelerNotificationsPageClient } from "@/components/app/dashboard/traveler/TravelerNotificationsPageClient";
import {
  NOTIFICATIONS_PAGE_SIZE,
  notificationListWhere,
  parseNotificationStatus,
  toClientNotification,
} from "@/lib/notifications/list-query";

export default async function TravelerNotificationsPage(props: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await props.params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect(`/${params.locale}/login`);
  }

  const locale = hasLocale(params.locale) ? params.locale : "es";
  const dict = await getDictionary(locale);

  const sp = await props.searchParams;
  const status = parseNotificationStatus(sp.status);
  const page = Math.max(1, Number(sp.page) || 1);
  const where = notificationListWhere({
    userId: session.user.id,
    audience: "TRAVELER",
    status,
  });

  const [rows, total, unreadTotal] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * NOTIFICATIONS_PAGE_SIZE,
      take: NOTIFICATIONS_PAGE_SIZE,
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({
      where: notificationListWhere({
        userId: session.user.id,
        audience: "TRAVELER",
        status: "unread",
      }),
    }),
  ]);

  return (
    <Section className="py-10!">
      <div className="rt-container text-left">
        <TravelerNotificationsPageClient
          audience="TRAVELER"
          copy={dict.notifications}
          initialNotifications={rows.map(toClientNotification)}
          initialPage={page}
          initialStatus={status}
          initialTotal={total}
          initialUnreadTotal={unreadTotal}
          locale={locale}
        />
      </div>
    </Section>
  );
}
