import type { SocialNetwork } from "@/types/tripper";

export const SOCIAL_NETWORK_CONFIG: Record<
  SocialNetwork,
  { label: string; color: string; prefix: string; placeholder: string }
> = {
  instagram: {
    label: "Instagram",
    color: "#E1306C",
    prefix: "@",
    placeholder: "yourhandle",
  },
  tiktok: {
    label: "TikTok",
    color: "#010101",
    prefix: "@",
    placeholder: "yourhandle",
  },
  youtube: {
    label: "YouTube",
    color: "#FF0000",
    prefix: "",
    placeholder: "channel URL or @handle",
  },
  facebook: {
    label: "Facebook",
    color: "#1877F2",
    prefix: "",
    placeholder: "profile URL or username",
  },
  twitter: {
    label: "X / Twitter",
    color: "#000000",
    prefix: "@",
    placeholder: "yourhandle",
  },
  pinterest: {
    label: "Pinterest",
    color: "#E60023",
    prefix: "@",
    placeholder: "yourhandle",
  },
  linkedin: {
    label: "LinkedIn",
    color: "#0A66C2",
    prefix: "",
    placeholder: "profile URL or username",
  },
  whatsapp: {
    label: "WhatsApp",
    color: "#25D366",
    prefix: "",
    placeholder: "phone or link",
  },
};
