"use client";

import Link from "next/link";

export default function MinimalHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-black/40 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="inline-flex items-center">
          <img src="/logo-white.svg" alt="Randomtrip" className="h-6 w-auto" />
        </Link>
        <Link href="/auth/login" className="text-white/90 hover:text-white text-sm">
          Log in
        </Link>
      </div>
    </header>
  );
}