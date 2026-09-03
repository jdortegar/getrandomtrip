"use client";

import { Toaster as SonnerToaster } from "sonner";

type ToastTone = "success" | "error" | "warning" | "info";

const TONE_ICON: Record<ToastTone, { bg: string; fg: string; glyph: string }> = {
  success: { bg: "#16a34a", fg: "#fff", glyph: "✓" },
  error: { bg: "#dc2626", fg: "#fff", glyph: "×" },
  warning: { bg: "#eab308", fg: "#1f2937", glyph: "!" },
  info: { bg: "var(--color-secondary)", fg: "#fff", glyph: "i" },
};

function ToneIcon({ tone }: { tone: ToastTone }) {
  const { bg, fg, glyph } = TONE_ICON[tone];
  return (
    <span
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 22,
        height: 22,
        borderRadius: "9999px",
        backgroundColor: bg,
        color: fg,
        fontSize: 13,
        fontWeight: 700,
        lineHeight: 1,
      }}
    >
      {glyph}
    </span>
  );
}

export function Toaster() {
  return (
    <>
      {/* toast() with no explicit type renders no [data-icon] node at all, so the
          "default" tone is drawn via ::before instead of the icons prop. */}
      <style>{`
        [data-sonner-toast]:not([data-type])::before {
          content: "";
          display: block;
          flex-shrink: 0;
          width: 22px;
          height: 22px;
          border-radius: 9999px;
          background-color: #111827;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M10.268 21a2 2 0 0 0 3.464 0'/%3E%3Cpath d='M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326'/%3E%3C/svg%3E");
          background-size: 13px 13px;
          background-position: center;
          background-repeat: no-repeat;
        }
      `}</style>
      <SonnerToaster
        position="top-right"
        closeButton
        theme="light"
        icons={{
          success: <ToneIcon tone="success" />,
          error: <ToneIcon tone="error" />,
          warning: <ToneIcon tone="warning" />,
          info: <ToneIcon tone="info" />,
        }}
        toastOptions={{
          style: {
            backgroundColor: "#fff",
            border: "1px solid #e5e5e5",
            borderRadius: "12px",
            boxShadow:
              "0 10px 15px -3px rgba(0,0,0,.1), 0 4px 6px -4px rgba(0,0,0,.1)",
            padding: "14px 16px",
            width: "380px",
            maxWidth: "calc(100vw - 32px)",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "flex-start",
            gap: "12px",
            fontFamily: "var(--font-barlow), sans-serif",
          },
          actionButtonStyle: {
            background: "transparent",
            color: "var(--color-secondary)",
            fontSize: "13px",
            fontWeight: 600,
            textDecoration: "underline",
            textUnderlineOffset: "3px",
            padding: 0,
            height: "auto",
            boxShadow: "none",
            marginLeft: "34px",
            marginTop: "4px",
            flexBasis: "calc(100% - 34px)",
            flexGrow: 0,
            flexShrink: 0,
            textAlign: "left",
          },
          classNames: {
            icon: "!m-0 !flex !h-[22px] !w-[22px] !items-center !justify-center",
            title: "!text-[14px] !font-semibold !leading-[1.25] !text-[#111827]",
            description: "!text-[13px] !text-[#737373]",
            closeButton:
              "!left-auto !top-[14px] !right-4 !h-[22px] !w-[22px] !transform-none !rounded-[6px] !border-0 !bg-transparent !text-[#a3a3a3] hover:!bg-[#f5f5f5]",
          },
        }}
      />
    </>
  );
}
