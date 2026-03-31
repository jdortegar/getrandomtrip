"use client";

import Link from "next/link";
import { ChevronDown, LogOut } from "lucide-react";
import { signOut as nextAuthSignOut } from "next-auth/react";
import type { User } from "@/types/core";
import { useMenuState } from "@/hooks/useMenuState";
import { UserAvatar } from "@/components/ui/UserAvatar";

/** Minimal user shape for navbar (all optional). */
type NavbarUser = Partial<Pick<User, "name" | "avatar" | "role">>;

const PROFILE_MENU_ITEM = {
  href: "/profile",
};

const TRIPPER_MENU_ITEM = {
  href: "/dashboard/tripper",
};

const DASHBOARD_MENU_ITEM = {
  href: "/dashboard",
};

export interface NavbarProfileLabels {
  ariaOpenProfileMenu: string;
  dashboard: string;
  editProfile: string;
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
        <UserAvatar height={32} width={32} />
        <ChevronDown size={16} className="ml-1" />
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 mt-3 w-48 rounded-xl bg-white/90 backdrop-blur-xl shadow-lg ring-1 ring-black/5 p-2 text-neutral-900"
        >
          <Link
            className="block px-4 py-2 text-sm rounded hover:bg-neutral-50"
            href={PROFILE_MENU_ITEM.href}
            onClick={close}
            role="menuitem"
          >
            {labels.editProfile}
          </Link>

          <Link
            className="block px-4 py-2 text-sm rounded hover:bg-neutral-50"
            href={DASHBOARD_MENU_ITEM.href}
            onClick={close}
            role="menuitem"
          >
            {labels.dashboard}
          </Link>
          <Link
            className="block px-4 py-2 text-sm rounded hover:bg-neutral-50"
            href={TRIPPER_MENU_ITEM.href}
            onClick={close}
            role="menuitem"
          >
            {labels.tripperOs}
          </Link>

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
