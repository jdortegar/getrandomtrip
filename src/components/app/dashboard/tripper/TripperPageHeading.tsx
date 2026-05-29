'use client';

import { usePathname } from 'next/navigation';
import { PageHeading } from '@/components/layout/PageHeading';
import { useDictionary, useLocale } from '@/hooks/useDictionary';

export function TripperPageHeading() {
  const pathname = usePathname();
  const locale = useLocale();
  const headings = useDictionary((d) => d.tripperDashboard.pageHeadings);

  function base(path: string) {
    return `/${locale}/dashboard/tripper${path}`;
  }

  function resolve() {
    if (pathname === base('/experiences/new')) return headings.experiencesNew;
    if (pathname.match(new RegExp(`^${base('/experiences/')}.+`))) return headings.experiencesEdit;
    if (pathname === base('/experiences') || pathname.startsWith(base('/experiences/'))) return headings.experiences;
    if (pathname.startsWith(base('/earnings'))) return headings.earnings;
    if (pathname.startsWith(base('/reviews')))  return headings.reviews;
    if (pathname.startsWith(base('/blogs')))    return headings.blogs;
    return headings.dashboard;
  }

  const { title, description } = resolve();

  return (
    <PageHeading
      className="text-center"
      title={title}
      description={description}
    />
  );
}
