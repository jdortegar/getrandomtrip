'use client';

import { Phone, User } from 'lucide-react';

interface NavbarActionsProps {
  isAuthed: boolean;
  onAuthClick: () => void;
}

export function NavbarActions({ isAuthed, onAuthClick }: NavbarActionsProps) {
  return (
    <div className="flex items-center gap-2">
      <a
        href="https://wa.me/526241928208"
        target="_blank"
        rel="noopener"
        aria-label="WhatsApp"
        className="p-2 rounded-lg hover:bg-white/10"
      >
        <Phone className="h-5 w-5" />
      </a>

      {!isAuthed && (
        <button
          aria-label="Iniciar sesión"
          className="p-2 rounded-lg hover:bg-white/10"
          onClick={onAuthClick}
        >
          <User className="h-5 w-5" />
        </button>
      )}

      {/* <span
        aria-label="Idioma: Español"
        className="inline-flex items-center justify-center h-8 w-8 rounded-full border border-white/30 text-xs font-semibold"
      >
        ES
      </span> */}
    </div>
  );
}
