import { cn } from "@/lib/utils";

export const formControlClass = cn(
  "bg-white border border-gray-200 outline-none px-6 py-4 rounded-xl text-base text-ink w-full",
  "placeholder:text-gray-500",
  "focus:border-primary focus:ring-2 focus:ring-primary/20",
  "disabled:cursor-not-allowed disabled:opacity-50",
);

export const formLabelClass = "block font-normal text-gray-600 text-base";
