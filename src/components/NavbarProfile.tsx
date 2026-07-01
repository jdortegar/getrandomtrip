"use client";

import Link from "next/link";
import { ChevronDown, LogOut } from "lucide-react";
import { signOut as nextAuthSignOut } from "next-auth/react";
import type { User } from "@/types/core";
import { useMenuState } from "@/hooks/useMenuState";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { hasRoleAccess } from "@/lib/auth/roleAccess";
import { TripperUnreadDot } from "@/components/app/dashboard/tripper/TripperUnreadDot";

/** Minimal user shape for navbar (all optional). */
type NavbarUser = Partial<Pick<User, "name" | "avatar" | "role" | "roles">>;

const TRIPPER_MENU_ITEM = {
  href: "/dashboard/tripper",
};

const DASHBOARD_MENU_ITEM = {
  href: "/dashboard/client",
};

const ADMIN_MENU_ITEM = {
  href: "/dashboard/admin",
};

const NEW_DROP_MENU_ITEM = {
  href: "/dashboard/admin/xsed/new",
};

export interface NavbarProfileLabels {
  adminDashboard: string;
  ariaOpenProfileMenu: string;
  dashboard: string;
  editProfile: string;
  newDrop: string;
  signOut: string;
  tripperOs: string;
}

interface NavbarProfileProps {
  labels: NavbarProfileLabels;
  onSignOut: () => void;
  session: any;
  user: NavbarUser;
}

export function NavbarProfile({
  labels,
  onSignOut,
  session,
  user,
}: NavbarProfileProps) {
  const { isOpen, toggle, close, menuRef } = useMenuState();
  const sessionUser = session?.user as
    | { role?: string; roles?: User["roles"] }
    | undefined;
  const adminSubject =
    sessionUser?.roles && sessionUser.roles.length > 0
      ? { role: sessionUser.role, roles: sessionUser.roles }
      : user?.roles && user.roles.length > 0
        ? { role: user.role, roles: user.roles }
        : { role: sessionUser?.role ?? user?.role };
  const isAdmin = hasRoleAccess(adminSubject, "admin");

  // Strict check — does not promote admin to tripper.
  const userRoles: string[] = (sessionUser?.roles ??
    user?.roles ??
    []) as string[];
  const isTripper = userRoles.some((r) => r?.toLowerCase() === "tripper");

  const handleSignOut = () => {
    if (session) {
      nextAuthSignOut({ callbackUrl: "/" });
    } else {
      onSignOut();
    }
    close();
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        aria-label={labels.ariaOpenProfileMenu}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className="p-1 rounded-full hover:bg-white/10 flex items-center justify-center"
        onClick={toggle}
      >
        <span className="relative">
          <UserAvatar height={32} width={32} />
          {isTripper && <TripperUnreadDot />}
        </span>
        <ChevronDown size={16} className="ml-1" />
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 mt-3 w-48 rounded-xl bg-white/90 backdrop-blur-xl shadow-lg ring-1 ring-black/5 p-2 text-neutral-900"
        >
          <Link
            className="block px-4 py-2 text-sm rounded hover:bg-neutral-50"
            href={DASHBOARD_MENU_ITEM.href}
            onClick={close}
            role="menuitem"
          >
            {labels.dashboard}
          </Link>
          {isTripper && (
            <Link
              className="flex items-center justify-between px-4 py-2 text-sm rounded hover:bg-neutral-50"
              href={TRIPPER_MENU_ITEM.href}
              onClick={close}
              role="menuitem"
            >
              {labels.tripperOs}
              <TripperUnreadDot variant="inline" />
            </Link>
          )}
          {isAdmin ? (
            <>
              <div className="my-1 h-px bg-neutral-200" />
              <p className="px-4 py-1 text-xs font-semibold uppercase tracking-wide text-neutral-400">
                Admin
              </p>
              <Link
                className="block px-4 py-2 text-sm rounded hover:bg-neutral-50"
                href={ADMIN_MENU_ITEM.href}
                onClick={close}
                role="menuitem"
              >
                {labels.adminDashboard}
              </Link>
              <Link
                className="block px-4 py-2 text-sm rounded hover:bg-neutral-50"
                href={NEW_DROP_MENU_ITEM.href}
                onClick={close}
                role="menuitem"
              >
                {labels.newDrop}
              </Link>
            </>
          ) : null}

          <div className="my-1 h-px bg-neutral-200" />

          <button
            className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm rounded hover:bg-neutral-50"
            onClick={handleSignOut}
            role="menuitem"
          >
            <LogOut size={16} /> {labels.signOut}
          </button>
        </div>
      )}
    </div>
  );
}
