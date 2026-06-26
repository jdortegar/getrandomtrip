"use client";

import { useParams } from "next/navigation";
import esCopy from "@/dictionaries/es.json";
import enCopy from "@/dictionaries/en.json";

export type AppDictionary = typeof esCopy;

function getDict(locale: string): AppDictionary {
  return locale.startsWith("en") ? enCopy : esCopy;
}

export function useDictionary<T>(selector: (dict: AppDictionary) => T): T;
export function useDictionary(): AppDictionary;
export function useDictionary<T>(
  selector?: (dict: AppDictionary) => T,
): T | AppDictionary {
  const params = useParams();
  const locale = (params?.locale as string) ?? "es";
  const dict = getDict(locale);
  return selector ? selector(dict) : dict;
}

export function useLocale(): string {
  const params = useParams();
  return (params?.locale as string) ?? "es";
}
