"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";

export function useSyncLocale(): void {
  const { data: session } = useSession();
  const params = useParams();
  const locale = (params?.locale as string) ?? "es";

  useEffect(() => {
    const current = session?.user?.locale;
    if (!session?.user?.id) return;
    if (current === locale) return;

    void fetch("/api/user/locale", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale }),
    }).catch(() => {});
  }, [session?.user?.id, session?.user?.locale, locale]);
}
