"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Language = "es" | "en";
type TextDict = { es: string; en: string };

// Diccionario de claves → textos.
const STRINGS: Record<string, TextDict> = {
  startYourJourney:         { es: "Comienza tu Viaje", en: "Start Your Journey" },
  chooseHowToStart:         { es: "Elige cómo quieres empezar a dar forma a tu aventura.", en: "Choose how you want to start shaping your adventure." },
  byTraveller:              { es: "By Traveller", en: "By Traveller" },
  topTrippers:              { es: "Top Trippers", en: "Top Trippers" },
  roadtrips:                { es: "Roadtrips", en: "Roadtrips" },
  trippersDecode:           { es: "Trippers Decode", en: "Trippers Decode" },
  byTravellerSubtitle:      { es: "¿Con quién vas a escribir tu próxima historia?", en: "Who will you write your next story with?" },
  topTrippersSubtitle:      { es: "Ellos ya dejaron huella. ¿Quién será tu cómplice de viaje?", en: "They have already left their mark. Who will be your travel partner?" },
  roadtripsSubtitle:        { es: "Libertad sobre ruedas. Tú eliges el ritmo.", en: "Freedom on wheels. You choose the pace." },
  trippersDecodeSubtitle:   { es: "Rutas con alma, contadas por quienes las vivieron.", en: "Routes with soul, told by those who lived them." },
  searchYourFavoriteTripper:{ es: "Busca a tu Tripper favorito", en: "Search for your favorite Tripper" },
  writeAName:               { es: "Escribe un nombre...", en: "Write a name..." },
  search:                   { es: "Buscar", en: "Search" },
  whereNext:                { es: "Where next? Ej: Río Negro", en: "Where next? e.g., Río Negro" },
  anyMonth:                 { es: "Cualquier Mes", en: "Any Month" },
};

type TArg = TextDict | string;

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (input: TArg) => string;
  tx: (es: string, en: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const detectInitialLang = (): Language => {
  if (typeof window !== "undefined") {
    const saved = window.localStorage.getItem("lang") as Language | null;
    if (saved === "es" || saved === "en") return saved;
    const nav = navigator.language?.toLowerCase() || "";
    if (nav.startsWith("es")) return "es";
  }
  return "es";
};

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [lang, setLangState] = useState<Language>(detectInitialLang());

  const setLang = (l: Language) => {
    setLangState(l);
    if (typeof window !== "undefined") localStorage.setItem("lang", l);
  };

  const t = (input: TArg): string => {
    const language = lang ?? "es";
    if (typeof input === "string") {
      const hit = STRINGS[input];
      if (hit) return language === "es" ? hit.es : hit.en;
      return input; // fallback: devuelve la clave tal cual si no existe en STRINGS
    }
    const fb = language === "es" ? "en" : "es";
    return input[language as keyof typeof input] ?? input[fb as keyof typeof input] ?? "";
  };

  // Atajo cuando no querés armar el objeto {es, en}
  const tx = (es: string, en: string): string => t({ es, en });

  const value = useMemo(() => ({ lang, setLang, t, tx }), [lang]);

  // Permite override one-shot con ?lang=es|en
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