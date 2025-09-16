"use client";

import { Tripper } from "@/content/trippers";
import Link from "next/link";
import { FaWhatsapp } from "react-icons/fa";

type Props = {
  tripper: Tripper;
};

export default function ContactSticky({ tripper }: Props) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 p-4 shadow-lg md:hidden z-50">
      <div className="flex justify-around items-center">
        <Link
          href="https://wa.me/526241928208"
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 mx-2 bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg text-center flex items-center justify-center"
        >
          <FaWhatsapp className="mr-2" /> WhatsApp
        </Link>
        <Link
          href="#tiers" // Anchor to the tiers section
          className="flex-1 mx-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg text-center"
        >
          Reservar
        </Link>
      </div>
    </div>
  );
}