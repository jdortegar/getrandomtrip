"use client";

import { useEffect, useState } from "react";

export default function NewsletterBar() {
  const LS_KEY = "rt_newsletter_dismissed_v1";
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    try {
      const dismissed = typeof window !== "undefined" && localStorage.getItem(LS_KEY) === "true";
      setOpen(!dismissed);
    } catch {
      setOpen(true);
    }
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(LS_KEY, "true");
    } catch {}
    setOpen(false);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\\.[^\s@]+$/.test(email)) {
      setMsg("Por favor, ingresá un email válido.");
      return;
    }
    setMsg(null);
    setLoading(true);

    // Intento de POST opcional a /api/newsletter
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setMsg("¡Listo! Revisá tu correo para confirmar.");
        // Podés trackear: window.dataLayer?.push({ event: "newsletter_subscribe", email });
        setTimeout(dismiss, 1200);
      } else {
        setMsg("Hubo un problema. Intentá de nuevo.");
      }
    } catch {
      // Si no existe endpoint, no romper: log suave y cerrar igual
      console.log("[Newsletter] Endpoint no disponible. Email:", email);
      setMsg("¡Gracias! Te contactaremos pronto.");
      setTimeout(dismiss, 1000);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div
      role="region"
      aria-label="Suscripción al newsletter"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-neutral-900/95 backdrop-blur supports-[backdrop-filter]:backdrop-blur-md text-white"
    >
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-6">
          {/* Copy */}
          <div className="flex-1">
            <p className="text-sm md:text-base">
              <span className="font-semibold">Newsletter mensual</span> — historias, destinos y serendipia curada.
            </p>
            {msg && <p className="mt-1 text-xs text-neutral-300">{msg}</p>}
          </div>

          {/* Form */}
          <form onSubmit={onSubmit} className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center">
            <label htmlFor="newsletter-email" className="sr-only">Email</label>
            <input
              id="newsletter-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tuemail@ejemplo.com"
              className="w-full md:w-80 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-white placeholder-white/60 outline-none focus:border-white/40"
            />
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-2 text-neutral-900 font-semibold hover:opacity-90 disabled:opacity-70"
            >
              {loading ? "Enviando..." : "SUSCRIBIRME"}
            </button>
          </form>

          {/* Close */}
          <button
            aria-label="Cerrar barra de newsletter"
            onClick={dismiss}
            className="absolute right-3 top-3 md:static md:right-auto md:top-auto inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/20 text-white/80 hover:text-white"
          >
            ×
          </button>
        </div>
      </div>
      <div className="pb-[env(safe-area-inset-bottom)]" />
    </div>
  );
}
