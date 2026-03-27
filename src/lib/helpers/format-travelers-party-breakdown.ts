import type { Dictionary } from '@/lib/i18n/dictionaries';
import type { PaxDetails } from '@/lib/types/PaxDetails';

function segment(
  one: string | undefined,
  many: string | undefined,
  n: number,
): string {
  const template = n === 1 ? one : many;
  return template?.replace('{count}', String(n)) ?? '';
}

export function formatTravelersPartyBreakdown(
  copy: Dictionary['journey']['checkout'],
  details: PaxDetails,
): string {
  const { adults, minors, rooms } = details;
  const sep = copy.travelersBreakdownSeparator;
  const parts: string[] = [];
  if (adults > 0) {
    parts.push(
      segment(
        copy.travelersAdultsOne,
        copy.travelersAdultsMany,
        adults,
      ),
    );
  }
  if (minors > 0) {
    parts.push(
      segment(
        copy.travelersMinorsOne,
        copy.travelersMinorsMany,
        minors,
      ),
    );
  }
  if (rooms > 0) {
    parts.push(
      segment(
        copy.travelersRoomsOne,
        copy.travelersRoomsMany,
        rooms,
      ),
    );
  }
  return parts.filter(Boolean).join(sep);
}
