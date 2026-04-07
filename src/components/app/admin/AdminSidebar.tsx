"use client";

import { useParams, usePathname } from "next/navigation";
import {
  Briefcase,
  CreditCard,
  Mail,
  Package,
  Star,
  Users,
} from "lucide-react";
import { AdminSidebarLink } from "./AdminSidebarLink";

export function AdminSidebar() {
  const pathname = usePathname();
  const params = useParams();
  const locale = (params?.locale as string) ?? "es";

  function base(path: string) {
    return `/${locale}/dashboard/admin${path}`;
  }

  function isActive(href: string) {
    const root = base("");
    if (href === root) return pathname === root;
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  const links = [
    { href: base(""), icon: Briefcase, label: "Trip Requests" },
    { href: base("/users"), icon: Users, label: "Users" },
    { href: base("/packages"), icon: Package, label: "Packages" },
    { href: base("/payments"), icon: CreditCard, label: "Payments" },
    { href: base("/reviews"), icon: Star, label: "Reviews" },
    { href: base("/waitlist"), icon: Mail, label: "Waitlist" },
  ];

  return (
    <aside className="flex w-48 shrink-0 flex-col border-r border-gray-200 bg-white h-full">
      <div className="border-b border-gray-100 px-4 py-3">
        <p className="font-barlow-condensed text-xl font-extrabold uppercase  text-gray-900">
          Admin Panel
        </p>
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2">
        {links.map((link) => (
          <AdminSidebarLink
            key={link.href}
            href={link.href}
            icon={link.icon}
            isActive={isActive(link.href)}
            label={link.label}
          />
        ))}
      </nav>
    </aside>
  );
}
