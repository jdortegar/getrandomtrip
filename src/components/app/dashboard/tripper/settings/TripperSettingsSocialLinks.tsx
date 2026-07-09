"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import { SOCIAL_NETWORK_CONFIG } from "@/lib/socialNetworks";
import type { SocialLink, SocialNetwork } from "@/types/tripper";

const ALL_NETWORKS = Object.keys(SOCIAL_NETWORK_CONFIG) as SocialNetwork[];

interface SocialIconProps {
  color: string;
  network: SocialNetwork;
  size?: number;
}

function SocialIcon({ color, network, size = 16 }: SocialIconProps) {
  const common = {
    fill: "none",
    height: size,
    stroke: color,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 2,
    viewBox: "0 0 24 24",
    width: size,
  };

  switch (network) {
    case "instagram":
      return (
        <svg {...common}>
          <rect height="20" rx="5" width="20" x="2" y="2" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.5" cy="6.5" r="1" />
        </svg>
      );
    case "tiktok":
      return (
        <svg {...common}>
          <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
        </svg>
      );
    case "youtube":
      return (
        <svg {...common}>
          <path d="M22.5 6.4a2.8 2.8 0 0 0-2-2C18.9 4 12 4 12 4s-6.9 0-8.5.5a2.8 2.8 0 0 0-2 2A29 29 0 0 0 1 12a29 29 0 0 0 .5 5.6 2.8 2.8 0 0 0 2 2C5.1 20 12 20 12 20s6.9 0 8.5-.4a2.8 2.8 0 0 0 2-2A29 29 0 0 0 23 12a29 29 0 0 0-.5-5.6z" />
          <polygon points="9.75 15.02 15.5 12 9.75 8.98" />
        </svg>
      );
    case "facebook":
      return (
        <svg {...common}>
          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
        </svg>
      );
    case "twitter":
      return (
        <svg {...common}>
          <path d="M4 4l16 16M4 20L20 4" />
        </svg>
      );
    case "linkedin":
      return (
        <svg {...common}>
          <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" />
          <rect height="12" width="4" x="2" y="9" />
          <circle cx="4" cy="4" r="2" />
        </svg>
      );
    case "whatsapp":
      return (
        <svg {...common}>
          <path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 8.5-8.5h.5a8.5 8.5 0 0 1 8 8.5z" />
        </svg>
      );
    case "pinterest":
      return (
        <svg {...common}>
          <path d="M12 2C6.5 2 2 6.5 2 12c0 4.2 2.6 7.9 6.4 9.5-.1-.8-.1-2.1.1-3l1.5-6.3s-.4-.8-.4-2c0-1.8 1.1-3.2 2.5-3.2 1.2 0 1.8.9 1.8 2 0 1.2-.8 3-1.2 4.6-.3 1.4.7 2.5 2 2.5 2.4 0 4-3.1 4-6.7 0-2.8-2-4.7-4.9-4.7-3.3 0-5.3 2.5-5.3 5.1 0 1 .4 2.1.9 2.7.1.1.1.3 0 .4l-.3 1.4c-.1.2-.2.3-.5.2C5.2 15.8 4 13.4 4 11c0-4.3 3.1-8.2 9-8.2 4.7 0 8.4 3.4 8.4 7.9 0 4.7-3 8.5-7.1 8.5-1.4 0-2.7-.7-3.1-1.5l-.8 3.1c-.3 1.1-1.1 2.5-1.7 3.3.8.2 1.5.3 2.3.3 5.5 0 10-4.5 10-10S17.5 2 12 2z" />
        </svg>
      );
    default:
      return null;
  }
}

function NetworkBadge({ network, size }: { network: SocialNetwork; size: number }) {
  const config = SOCIAL_NETWORK_CONFIG[network];
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full border"
      style={{
        backgroundColor: `${config.color}26`,
        borderColor: `${config.color}54`,
        height: size,
        width: size,
      }}
    >
      <SocialIcon color={config.color} network={network} size={size * 0.44} />
    </span>
  );
}

interface TripperSettingsSocialLinksProps {
  copy: { addNetwork: string; noLinks: string };
  isEditing: boolean;
  links: SocialLink[];
  onChange: (links: SocialLink[]) => void;
}

export function TripperSettingsSocialLinks({
  copy,
  isEditing,
  links,
  onChange,
}: TripperSettingsSocialLinksProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const usedNetworks = new Set(links.map((l) => l.network));
  const availableNetworks = ALL_NETWORKS.filter((n) => !usedNetworks.has(n));

  function updateHandle(network: SocialNetwork, handle: string) {
    onChange(links.map((l) => (l.network === network ? { ...l, handle } : l)));
  }

  function removeLink(network: SocialNetwork) {
    onChange(links.filter((l) => l.network !== network));
  }

  function addNetwork(network: SocialNetwork) {
    onChange([...links, { network, handle: "" }]);
    setIsDropdownOpen(false);
  }

  if (links.length === 0 && !isEditing) {
    return <p className="text-sm italic text-neutral-400">{copy.noLinks}</p>;
  }

  return (
    <div>
      {links.length > 0 && (
        <div className="divide-y divide-neutral-100">
          {links.map((link) => {
            const config = SOCIAL_NETWORK_CONFIG[link.network];
            return (
              <div className="flex items-center gap-3 py-2.5" key={link.network}>
                <NetworkBadge network={link.network} size={36} />
                <span className="w-24 shrink-0 text-sm font-semibold text-neutral-700">
                  {config.label}
                </span>
                {isEditing ? (
                  <div className="flex flex-1 items-center gap-2">
                    <div className="flex flex-1 items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 focus-within:border-light-blue">
                      {config.prefix && (
                        <span className="text-sm text-neutral-400">
                          {config.prefix}
                        </span>
                      )}
                      <input
                        className="w-full bg-transparent text-sm text-neutral-800 outline-none"
                        onChange={(e) =>
                          updateHandle(link.network, e.target.value)
                        }
                        placeholder={config.placeholder}
                        type="text"
                        value={link.handle}
                      />
                    </div>
                    <button
                      aria-label={config.label}
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
                      onClick={() => removeLink(link.network)}
                      type="button"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <span className="text-sm text-neutral-600">
                    {config.prefix}
                    {link.handle}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {isEditing && (
        <div className="relative mt-3" ref={dropdownRef}>
          <button
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-gray-300 px-4 py-2 text-sm text-neutral-500 hover:border-gray-400 hover:text-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={availableNetworks.length === 0}
            onClick={() => setIsDropdownOpen((v) => !v)}
            type="button"
          >
            <Plus className="h-4 w-4" />
            {copy.addNetwork}
          </button>
          {isDropdownOpen && availableNetworks.length > 0 && (
            <div className="absolute z-10 mt-1 max-h-[240px] w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
              {availableNetworks.map((network) => (
                <button
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-neutral-700 hover:bg-gray-50"
                  key={network}
                  onMouseDown={() => addNetwork(network)}
                  type="button"
                >
                  <NetworkBadge network={network} size={28} />
                  {SOCIAL_NETWORK_CONFIG[network].label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
