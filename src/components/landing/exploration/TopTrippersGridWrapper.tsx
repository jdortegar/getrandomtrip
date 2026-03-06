import { getAllTrippers } from '@/lib/db/tripper-queries';
import { hasLocale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { TopTrippersGrid } from './TopTrippersGrid';

interface TopTrippersGridWrapperProps {
  locale?: string;
}

export async function TopTrippersGridWrapper({
  locale = 'es',
}: TopTrippersGridWrapperProps = {}) {
  const trippers = await getAllTrippers();
  const resolvedLocale = hasLocale(locale) ? locale : 'es';
  const dict = await getDictionary(resolvedLocale);
  const { buttonTrippers: buttonText, trippersHref } = dict.home.exploration;

  return (
    <TopTrippersGrid
      buttonHref={trippersHref}
      buttonText={buttonText}
      trippers={trippers}
    />
  );
}
