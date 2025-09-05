"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { useUserStore } from '@/store/userStore';
import AuthModal from '@/components/auth/AuthModal';
import { ChevronDown, LogOut } from 'lucide-react';

export default function Navbar({ variant = 'auto' }: { variant?: 'auto' | 'solid' }) {
  const [overlay, setOverlay] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const { isAuthed, user, signOut, openAuth } = useUserStore();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);

  // Detectar si estamos sobre el hero
  useEffect(() => {
    if (variant !== 'auto') return;
    const el = document.getElementById("hero-sentinel");
    if (!el) {
      const onScroll = () => setOverlay(window.scrollY < 1);
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
      return () => window.removeEventListener("scroll", onScroll);
    }
    const io = new IntersectionObserver(
      ([entry]) => setOverlay(entry.isIntersecting),
      { rootMargin: "-1px 0px 0px 0px", threshold: [0, 1] }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Cerrar dropdown con click afuera / Escape (for both menus)
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener("click", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  const headerClass = useMemo(
    () => {
      const isSolid = variant === 'solid' || (variant === 'auto' && !overlay);
      return isSolid
        ? "fixed top-0 w-full z-50 bg-white/70 text-neutral-900 backdrop-blur-md shadow ring-1 ring-black/5 transition-colors duration-200"
        : "fixed top-0 w-full z-50 bg-white/10 text-white backdrop-blur-md transition-colors duration-200";
    },
    [overlay]
  );

  return (
    <>
      <header data-site-header style={{ height: 'auto' }} className={headerClass}>
        <nav className="mx-auto h-16 max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Marca */}
          <Link
            href="/"
            aria-label="Randomtrip"
            className="flex items-center gap-2 shrink-0"
          >
            <Image
              src="/assets/logos/Logo.svg"
              alt="Randomtrip"
              width={256}
              height={64}
            />
          </Link>

          {/* Bloque central: lupa + enlaces + hamburger */}
          <div className="hidden md:flex items-center gap-6 text-sm font-medium">
            {/* Buscar */}
            <button
              type="button"
              className="p-2 rounded-full hover:bg-white/10"
              aria-label="Buscar"
              onClick={() =>
                window.dispatchEvent(new CustomEvent("open-search"))
              }
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <circle cx="11" cy="11" r="7" strokeWidth="2" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" strokeWidth="2" />
              </svg>
            </button>

            <Link
              href="/?tab=Top%20Trippers#start-your-journey-anchor"
              aria-label="Ir a la sección 'Comienza tu Viaje' con la tab 'Top Trippers' seleccionada"
            >
              Trippers’ Finder
            </Link>
            <Link href="/#inspiration" prefetch={false} className="hover:underline underline-offset-4">
              Trippers’ Inspiration
            </Link>
            <Link href="/nosotros" className="hover:underline underline-offset-4">
              Nosotros
            </Link>

            {/* Hamburger + dropdown */}
            <div className="relative" ref={menuRef}>
              <button
                aria-label="Abrir menú"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((v) => !v)}
                className="p-2 rounded-lg hover:bg-white/10"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path d="M4 6h16M4 12h16M4 18h16" strokeWidth="2" />
                </svg>
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-3 w-80 rounded-xl bg-white/90 backdrop-blur-xl shadow-lg ring-1 ring-black/5 p-2 text-neutral-900"
                >
                  <Link
                    role="menuitem"
                    href="/tripbuddy"
                    className="block px-4 py-2 text-sm rounded hover:bg-neutral-50"
                  >
                    IA TripBuddy
                  </Link>
                  <Link
                    role="menuitem"
                    href="/bitacoras"
                    className="block px-4 py-2 text-sm rounded hover:bg-neutral-50"
                  >
                    Off the Record: Bitácoras del Continente
                  </Link>
                  <button
                    role="menuitem"
                    disabled
                    className="block w-full text-left px-4 py-2 text-sm rounded opacity-60 cursor-not-allowed"
                    title="Próximamente"
                  >
                    Coming soon
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Bloque derecho */}
          <div className="flex items-center gap-4">
            <a
              href="https://wa.me/526241928208"
              target="_blank"
              rel="noopener"
              aria-label="WhatsApp"
              className="p-1 rounded-full hover:bg-white/10"
            >
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg"
                alt="WhatsApp"
                className="h-7 w-7"
              />
            </a>

            {isAuthed ? (
              <div className="relative" ref={profileMenuRef}>
                <button
                  aria-label="Abrir menú de perfil"
                  aria-haspopup="menu"
                  aria-expanded={profileMenuOpen}
                  onClick={() => setProfileMenuOpen((v) => !v)}
                  className="p-1 rounded-full hover:bg-white/10 flex items-center justify-center"
                >
                  {user?.avatarUrl ? (
                    <Image
                      src={user.avatarUrl}
                      alt={user.name}
                      width={24}
                      height={24}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="h-6 w-6 rounded-full bg-violet-600 text-white flex items-center justify-center text-xs font-semibold">
                      {user?.name ? user.name.charAt(0).toUpperCase() : 'R'}
                    </div>
                  )}
                  <ChevronDown size={16} className="ml-1" />
                </button>

                {profileMenuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 mt-3 w-48 rounded-xl bg-white/90 backdrop-blur-xl shadow-lg ring-1 ring-black/5 p-2 text-neutral-900"
                  >
                    <Link
                      role="menuitem"
                      href="/dashboard"
                      className="block px-4 py-2 text-sm rounded hover:bg-neutral-50"
                      onClick={() => setProfileMenuOpen(false)}
                    >
                      Mis viajes
                    </Link>
                    <Link
                      role="menuitem"
                      href="/login"
                      className="block px-4 py-2 text-sm rounded hover:bg-neutral-50"
                      onClick={() => setProfileMenuOpen(false)}
                    >
                      Mi perfil
                    </Link>
                    <div className="my-1 h-px bg-neutral-200" />
                    <button
                      role="menuitem"
                      onClick={() => {
                        signOut();
                        setProfileMenuOpen(false);
                      }}
                      className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm rounded hover:bg-neutral-50"
                    >
                      <LogOut size={16} /> Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                aria-label="Iniciar sesión"
                className="p-1 rounded-full hover:bg-white/10"
                onClick={() => window.dispatchEvent(new CustomEvent("open-auth"))}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path d="M12 12a5 5 0 100-10 5 5 0 000 10z" strokeWidth="2" />
                  <path d="M4 20a8 8 0 0116 0" strokeWidth="2" />
                </svg>
              </button>
            )}

            <span
              aria-label="Idioma: Español"
              className="inline-flex items-center justify-center h-8 w-8 rounded-full border border-white/30 text-xs font-semibold"
            >
              ES
            </span>
          </div>
        </nav>
      </header>

      {/* Spacer para que el contenido no quede tapado cuando deja de ser overlay */}
      {!overlay && <div aria-hidden className="h-16" />}

      <AuthModal /> {/* Mount AuthModal here */}
    </>
  );
}