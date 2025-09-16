"use client";
import { useLanguage } from "@/context/LanguageContext";

export default function LanguageSwitcher() {
  const { lang, setLang } = useLanguage();
  return (
    <div className="flex items-center gap-2 text-sm">
      <button
        className={`px-2 py-1 rounded ${lang==="es" ? "font-bold underline" : ""}`}
        onClick={() => setLang("es")}
        aria-pressed={lang==="es"}
      >
        ES
      </button>
      <button
        className={`px-2 py-1 rounded ${lang==="en" ? "font-bold underline" : ""}`}
        onClick={() => setLang("en")}
        aria-pressed={lang==="en"}
      >
        EN
      </button>
    </div>
  );
}