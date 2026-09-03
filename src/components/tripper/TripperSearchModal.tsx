"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";

const DEBOUNCE_MS = 300;

export interface TripperSearchItem {
  id: string;
  name: string;
  tripperSlug: string;
  avatarUrl: string | null;
  bio: string | null;
}

interface TripperSearchModalProps {
  onClose: () => void;
  open: boolean;
  trippers: TripperSearchItem[];
}

function TripperAvatarThumb({
  avatarUrl,
  name,
}: {
  avatarUrl: string | null;
  name: string;
}) {
  const [failed, setFailed] = useState(false);
  const initial = name.charAt(0).toUpperCase();

  if (!avatarUrl || failed) {
    return (
      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-200 font-semibold text-gray-500">
        {initial}
      </div>
    );
  }

  return (
    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-gray-200">
      <Image
        alt={name}
        fill
        onError={() => setFailed(true)}
        sizes="48px"
        src={avatarUrl}
        style={{ objectFit: "cover" }}
      />
    </div>
  );
}

function filterTrippers(
  trippers: TripperSearchItem[],
  query: string,
): TripperSearchItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return trippers;
  return trippers.filter(
    (t) =>
      t.name.toLowerCase().includes(q) ||
      (t.bio?.toLowerCase().includes(q) ?? false),
  );
}

export default function TripperSearchModal({
  onClose,
  open,
  trippers,
}: TripperSearchModalProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => {
      setDebouncedQuery(query);
    }, DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [query, open]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setDebouncedQuery("");
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  const matches = useMemo(
    () => filterTrippers(trippers, debouncedQuery),
    [trippers, debouncedQuery],
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-labelledby="tripper-search-modal-title"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-xl rounded-lg border border-gray-200 bg-white shadow-2xl">
        <button
          aria-label="Cerrar"
          className="absolute right-4 top-4 z-20 cursor-pointer rounded-md p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600"
          onClick={onClose}
          type="button"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="px-8 py-10 sm:px-12">
          <div className="mb-8">
            <h2
              className="font-barlow-condensed text-3xl font-bold uppercase text-neutral-800"
              id="tripper-search-modal-title"
            >
              Busca tu Tripper
            </h2>
            <p className="mt-2 text-lg font-light text-ink">
              Encuentra el experto perfecto para tu aventura
            </p>
          </div>

          <input
            aria-label="Buscar tripper por nombre"
            className="w-full rounded-sm border border-gray-200 px-3 py-2 text-sm text-ink placeholder:text-gray-500 focus:border-secondary focus:outline-none focus:ring-1 focus:ring-secondary"
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Escribí un nombre..."
            type="search"
            value={query}
          />

          <div className="mt-4 max-h-80 overflow-y-auto rounded-md border border-gray-100">
            {matches.length === 0 ? (
              <p className="p-4 text-center text-sm text-gray-500">
                {debouncedQuery.trim()
                  ? "Ningún tripper coincide con la búsqueda."
                  : "Escribí para buscar."}
              </p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {matches.map((tripper) => {
                  return (
                    <li key={tripper.id}>
                      <Link
                        className="flex items-center gap-3 p-3 transition-colors hover:bg-gray-50"
                        href={`/trippers/${tripper.tripperSlug}`}
                        onClick={onClose}
                      >
                        <TripperAvatarThumb
                          avatarUrl={tripper.avatarUrl}
                          name={tripper.name}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-ink">
                            {tripper.name}
                          </p>
                          {tripper.bio && (
                            <p className="truncate text-sm text-gray-500">
                              {tripper.bio}
                            </p>
                          )}
                        </div>
                        <span className="shrink-0 text-sm text-secondary">
                          Ver perfil →
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="mt-6 flex items-center justify-center border-t border-gray-200 pt-6">
            <Link
              className="text-sm font-medium text-ink underline hover:no-underline"
              href="/trippers"
              onClick={onClose}
            >
              Ver todos los trippers
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
