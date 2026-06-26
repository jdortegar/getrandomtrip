"use client";

import { usePathname } from "next/navigation";
import { PageHeading } from "@/components/layout/PageHeading";
import { useDictionary } from "@/hooks/useDictionary";

export function TripperPageHeading() {
  const pathname = usePathname();
  const headings = useDictionary((d) => d.tripperDashboard.pageHeadings);

  function base(path: string) {
    return `/dashboard/tripper${path}`;
  }

  function resolve() {
    if (pathname === base("/experiences/new")) return headings.experiencesNew;
    if (pathname.match(new RegExp(`^${base("/experiences/")}.+`)))
      return headings.experiencesEdit;
    if (
      pathname === base("/experiences") ||
      pathname.startsWith(base("/experiences/"))
    )
      return headings.experiences;
    if (pathname.startsWith(base("/earnings"))) return headings.earnings;
    if (pathname.startsWith(base("/reviews"))) return headings.reviews;
    if (pathname.startsWith(base("/blogs"))) return headings.blogs;
    if (pathname.startsWith(base("/notifications"))) return headings.notifications;
    if (pathname.startsWith("/dashboard/admin/xsed")) return headings.newDrop;
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
