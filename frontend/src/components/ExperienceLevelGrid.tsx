import React from "react";
import { useRouter } from "next/navigation";
import { COUPLE_TIERS } from "@/content/tiers";

type Props = {
  onSelect: (packageId: string) => void;
  className?: string;
};

export default function ExperienceLevelGrid({ onSelect, className }: Props) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 ${className || ""}`}>
      {COUPLE_TIERS.map((level) => (
        <div
          key={level.key}
          className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 border border-gray-200 flex flex-col"
        >
          <div className="p-6 flex-grow">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">{level.title}</h3>
            <p className="text-gray-600 text-sm mb-4">{level.tagline || ''}</p>
            <p className="text-2xl font-extrabold text-[#D4AF37] mb-4">{level.price || ''}</p>
            <ul className="text-gray-700 text-sm space-y-2">
              {level.bullets.map((bullet, index) => (
                <li key={index} className="flex items-center">
                  <svg
                    className="w-4 h-4 text-[#D4AF37] mr-2 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    ></path>
                  </svg>
                  {bullet}
                </li>
              ))}
            </ul>
          </div>
          <div className="p-6 border-t border-gray-100">
            <button
              onClick={() => onSelect(level.key as string)}
              className="w-full bg-[#D4AF37] text-white py-3 rounded-lg font-semibold hover:bg-[#EACD65] transition-colors duration-200"
            >
              {level.cta}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
