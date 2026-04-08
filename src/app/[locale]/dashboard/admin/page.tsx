import { AdminTripRequestsPageClient } from './AdminTripRequestsPageClient';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { hasLocale } from '@/lib/i18n/config';

export default async function AdminTripRequestsPage({
  params,
}: {
  params: { locale: string };
}) {
  const locale = hasLocale(params.locale) ? params.locale : 'es';
  const dict = await getDictionary(locale);

  return <AdminTripRequestsPageClient tripEditCopy={dict.adminTripEditModal} />;
}
