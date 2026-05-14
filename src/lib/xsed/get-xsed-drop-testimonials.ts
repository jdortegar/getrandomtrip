import type { TestimonialData } from '@/components/Testimonials/types';
import { getCountryCode } from '@/lib/helpers/flags';
import { prisma } from '@/lib/prisma';

function formatReviewerAuthor(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'Viajero';
  if (parts.length === 1) return parts[0]!;
  const first = parts[0]!;
  const last = parts[parts.length - 1]!;
  const initial = last.charAt(0).toUpperCase();
  return `${first} ${initial}.`;
}

/**
 * Public testimonials from travelers who completed this XSED drop and left feedback
 * (`TripRequest` linked via `xsedExperienceId`).
 */
export async function getXsedDropTestimonials(
  xsedExperienceId: string,
): Promise<TestimonialData[]> {
  const rows = await prisma.tripRequest.findMany({
    where: {
      xsedExperienceId,
      status: 'COMPLETED',
      customerFeedback: { not: null },
    },
    orderBy: { completedAt: 'desc' },
    take: 24,
    include: {
      user: { select: { name: true, avatarUrl: true } },
    },
  });

  const out: TestimonialData[] = [];
  for (const tr of rows) {
    const quote = (tr.customerFeedback ?? '').trim();
    if (!quote) continue;

    const country = tr.originCountry?.trim() || 'Argentina';
    const code = getCountryCode(country);

    out.push({
      author: formatReviewerAuthor(tr.user.name),
      avatarUrl: tr.user.avatarUrl ?? undefined,
      country,
      ...(code && code.length === 2 ? { countryCode: code } : {}),
      quote,
    });
    if (out.length >= 9) break;
  }

  return out;
}
