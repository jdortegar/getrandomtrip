'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

const DEBOUNCE_MS = 300;

export interface TripperSearchItem {
  id: string;
  name: string;
  tripperSlug: string | null;
  avatarUrl: string | null;
  bio: string | null;
}

interface TripperSearchModalProps {
  onClose: () => void;
  open: boolean;
  trippers: TripperSearchItem[];
}

function filterTrippers(trippers: TripperSearchItem[], query: string): TripperSearchItem[] {
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
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => {
      setDebouncedQuery(query);
    }, DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [query, open]);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setDebouncedQuery('');
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, onClose]);

  const matches = useMemo(
    () => filterTrippers(trippers, debouncedQuery),
    [trippers, debouncedQuery],
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-labelledby="tripper-search-modal-title"
      aria-modal="true"
    >
      <div
        aria-hidden
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <div className="relative w-full max-w-xl rounded-lg border border-gray-200 bg-white p-6 shadow-md">
        <h2
          className="text-base font-bold text-gray-900"
          id="tripper-search-modal-title"
        >
          Busca tu Tripper
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Encuentra el experto perfecto para tu aventura
        </p>

        <input
          aria-label="Buscar tripper por nombre"
          className="mt-4 w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Escribí un nombre..."
          type="search"
          value={query}
        />

        <div className="mt-4 max-h-80 overflow-y-auto rounded-md border border-gray-100">
          {matches.length === 0 ? (
            <p className="p-4 text-center text-sm text-gray-500">
              {debouncedQuery.trim()
                ? 'Ningún tripper coincide con la búsqueda.'
                : 'Escribí para buscar.'}
            </p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {matches.map((tripper) => {
                const slug =
                  tripper.tripperSlug ||
                  tripper.name.toLowerCase().replace(/\s+/g, '-');
                return (
                  <li key={tripper.id}>
                    <Link
                      className="flex items-center gap-3 p-3 transition-colors hover:bg-gray-50"
                      href={`/trippers/${slug}`}
                      onClick={onClose}
                    >
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-gray-200">
                        <Image
                          alt={tripper.name}
                          fill
                          sizes="48px"
                          src={
                            tripper.avatarUrl ?? '/images/fallbacks/tripper-avatar.jpg'
                          }
                          style={{ objectFit: 'cover' }}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-gray-900">
                          {tripper.name}
                        </p>
                        {tripper.bio && (
                          <p className="truncate text-sm text-gray-500">
                            {tripper.bio}
                          </p>
                        )}
                      </div>
                      <span className="shrink-0 text-sm text-primary">
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
            className="text-sm font-medium text-gray-900 underline hover:no-underline"
            href="/trippers"
            onClick={onClose}
          >
            Ver todos los trippers
          </Link>
        </div>
      </div>
    </div>
  );
}
