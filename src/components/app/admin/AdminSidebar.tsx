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
import enCopy from "@/dictionaries/en.json";
import esCopy from "@/dictionaries/es.json";
import type { AdminSidebarDict } from "@/lib/types/dictionary";

export function AdminSidebar() {
  const pathname = usePathname();
  const params = useParams();
  const locale = (params?.locale as string) ?? "es";
  const copy = (
    (locale.startsWith("en") ? enCopy : esCopy) as unknown as {
      adminSidebar: AdminSidebarDict;
    }
  ).adminSidebar;

  function base(path: string) {
    return `/${locale}/dashboard/admin${path}`;
  }

  function isActive(href: string) {
    const root = base("");
    if (href === root) return pathname === root;
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  const links = [
    { href: base(""), icon: Briefcase, label: copy.links.tripRequests },
    { href: base("/users"), icon: Users, label: copy.links.users },
    { href: base("/experiences"), icon: Package, label: copy.links.experiences },
    { href: base("/payments"), icon: CreditCard, label: copy.links.payments },
    { href: base("/reviews"), icon: Star, label: copy.links.reviews },
    { href: base("/waitlist"), icon: Mail, label: copy.links.waitlist },
  ];

  return (
    <aside className="flex w-48 shrink-0 flex-col border-r border-gray-200 bg-white h-full">
      <div className="border-b border-gray-100 px-4 py-3">
        <p className="text-xl font-semibold text-neutral-900">
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
