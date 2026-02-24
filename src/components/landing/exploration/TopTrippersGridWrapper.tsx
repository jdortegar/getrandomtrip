import { getAllTrippers } from '@/lib/db/tripper-queries';
import { hasLocale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { pathForLocale } from '@/lib/i18n/pathForLocale';
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
  const trippersHref = pathForLocale(resolvedLocale, '/trippers');

  return (
    <TopTrippersGrid
      buttonHref={trippersHref}
      buttonText={dict.home.explorationButtonTrippers}
      trippers={trippers}
    />
  );
}
