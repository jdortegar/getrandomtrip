"use client";
import { createContext } from "react";
import type { DocumentFieldError } from "@/lib/types/DocumentValidation";
export const DocumentServerValidationContext = createContext<{
  errors: readonly DocumentFieldError[];
  attempt: number;
}>({ errors: [], attempt: 0 });
