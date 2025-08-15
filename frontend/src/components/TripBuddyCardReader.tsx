'use client';
import React from 'react';

type Card = { title: string; dist: string; body: string };

export default function TripBuddyCardReader({
  cards,
  onSpeak,
}: {
  cards: Card[];
  onSpeak: (text: string) => void;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {cards.map((c, i) => (
        <div key={i} className="rounded-2xl bg-white/5 border border-white/10 p-4">
          <div className="flex items-start justify-between">
            <h3 className="text-lg font-semibold">{c.title}</h3>
            <span className="text-xs bg-white/10 rounded-full px-2 py-1">{c.dist}</span>
          </div>
          <p className="text-white/80 text-sm mt-1">{c.body}</p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => onSpeak(`${c.title}. ${c.body}`)}
              className="text-sm px-3 py-2 rounded-xl bg-[#D4AF37] text-black font-semibold"
            >
              ▶️ Escuchar
            </button>
            <button className="text-sm px-3 py-2 rounded-xl border border-white/20">Ver mapa</button>
          </div>
        </div>
      ))}
    </div>
  );
}