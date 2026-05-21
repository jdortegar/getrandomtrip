import { hasLocale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { XsedBookClient } from '@/components/app/xsed/XsedBookClient';

type Props = {
  params: Promise<{ locale?: string }>;
};

export default async function XsedBookPage({ params }: Props) {
  const { locale: rawLocale } = await params;
  const normalizedLocale = hasLocale(rawLocale) ? rawLocale : 'es';
  const dict = await getDictionary(normalizedLocale);

  return (
    <XsedBookClient
      detailsStepLabels={dict.journey.detailsStep}
      locale={normalizedLocale}
      userBadgeLabels={dict.journey.userBadge}
    />
  );
}
