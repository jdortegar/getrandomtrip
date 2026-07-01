import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { hasLocale } from "@/lib/i18n/config";
import Section from "@/components/layout/Section";
import { ClientNotificationsPageClient } from "@/components/app/dashboard/client/ClientNotificationsPageClient";
import type { ClientNotification } from "@/types/notifications";
import type { NotificationMetadata } from "@/types/notifications";

export default async function ClientNotificationsPage(props: {
  params: Promise<{ locale: string }>;
}) {
  const params = await props.params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect(`/${params.locale}/login`);
  }

  const locale = hasLocale(params.locale) ? params.locale : "es";
  const dict = await getDictionary(locale);

  const rawNotifications = await prisma.notification.findMany({
    orderBy: { createdAt: "desc" },
    where: {
      audience: "CLIENT",
      userId: session.user.id,
    },
  });

  const initialNotifications: ClientNotification[] = rawNotifications.map(
    (n) => ({
      audience: n.audience,
      body: n.body,
      createdAt: n.createdAt.toISOString(),
      id: n.id,
      isRead: n.isRead,
      metadata: n.metadata as NotificationMetadata,
      title: n.title,
      type: n.type,
      userId: n.userId,
    }),
  );

  return (
    <Section className="py-10!">
      <div className="rt-container text-left">
        <ClientNotificationsPageClient
          copy={dict.notifications}
          initialNotifications={initialNotifications}
          locale={locale}
        />
      </div>
    </Section>
  );
}
