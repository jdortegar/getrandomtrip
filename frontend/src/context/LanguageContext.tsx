"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Language = "es" | "en";
type TextDict = Record<Language, string | undefined>;

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (dict: TextDict, opts?: { fallback?: Language }) => string;
  tx: (es: string | undefined, en?: string | undefined, opts?: { fallback?: Language }) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const detectInitialLang = (): Language => {
  // localStorage first
  if (typeof window !== "undefined") {
    const saved = window.localStorage.getItem("lang") as Language | null;
    if (saved === "es" || saved === "en") return saved;
    // then navigator
    const nav = navigator.language?.toLowerCase() || "";
    if (nav.startsWith("es")) return "es";
  }
  // default
  return "es";
};

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [lang, setLangState] = useState<Language>(detectInitialLang());

  const setLang = (l: Language) => {
    setLangState(l);
    if (typeof window !== "undefined") localStorage.setItem("lang", l);
  };

  // simple helpers:
  // t({es, en}) => returns current language; if missing, falls back to the other
  const t = (dict: TextDict, opts?: { fallback?: Language }) => {
    const fb = opts?.fallback ?? (lang === "es" ? "en" : "es");
    return dict[lang] ?? dict[fb] ?? "";
  };

  // tx("hola", "hello") => convenience wrapper when you don't want to build a dict
  const tx = (es?: string, en?: string, opts?: { fallback?: Language }) =>
    t({ es, en }, opts);

  const value = useMemo(() => ({ lang, setLang, t, tx }), [lang]);

  // Optional: allow ?lang=es|en one-shot override
  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    const q = url.searchParams.get("lang");
    if (q === "es" || q === "en") setLang(q);
  }, []);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
};