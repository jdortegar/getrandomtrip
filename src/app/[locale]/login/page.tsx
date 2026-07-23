"use client";

import { useEffect, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useUserStore } from "@/store/slices/userStore";
import AuthModal from "@/components/auth/AuthModal";
import Section from "@/components/layout/Section";
import { pathForLocale } from "@/lib/i18n/pathForLocale";
import type { Locale } from "@/lib/i18n/config";
import LoadingSpinner from "@/components/layout/LoadingSpinner";
import esCopy from "@/dictionaries/es.json";
import enCopy from "@/dictionaries/en.json";

function LoginContent() {
  const { data: session, status } = useSession();
  const { isAuthed } = useUserStore();
  const router = useRouter();
  const search = useSearchParams();
  const params = useParams();
  const locale = (params?.locale as string) ?? "es";
  const dict = locale.startsWith("en") ? enCopy : esCopy;

  // Auto-redirect if authenticated
  useEffect(() => {
    if (status !== "authenticated" && !isAuthed) return;

    const returnTo = search.get("returnTo");
    const dest = returnTo
      ? decodeURIComponent(returnTo)
      : pathForLocale(locale as Locale, "/");

    router.replace(dest);
  }, [status, session, isAuthed, router, search, locale]);

  // Show auth modal if not authenticated
  const showModal = status !== "loading" && !session && !isAuthed;

  return (
    <>
      <Section>
        {status === "loading" ? (
          <LoadingSpinner />
        ) : (
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="text-center text-neutral-700">
              {session || isAuthed ? "Redirigiendo..." : "Cargando..."}
            </div>
          </div>
        )}
      </Section>
      <AuthModal
        defaultMode="login"
        dict={dict}
        initialEmail={search.get("email") ?? undefined}
        isOpen={showModal}
        onClose={() => {}}
      />
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <LoginContent />
    </Suspense>
  );
}
