import Link from "next/link";
import Image from "next/image";

type Card = {
  key: "couple" | "solo" | "family" | "group" | "honeymoon" | "paws";
  title: string;
  href: string;
  img: string;
  alt: string;
  priority?: boolean;
};

const travellers: Card[] = [
  {
    key: "couple",
    title: "Couple",
    href: "/packages/by-type/couple",
    img: "/images/journey-types/couple-card.jpg",
    alt: "Viajes sorpresa en pareja",
    priority: true,
  },
  {
    key: "solo",
    title: "Solo",
    href: "/packages/by-type/solo",
    img: "/images/journey-types/solo-card.jpg",
    alt: "Viajes sorpresa en solitario",
    priority: true,
  },
  {
    key: "family",
    title: "Family",
    href: "/packages/by-type/family",
    img: "/images/journey-types/family-card.jpg",
    alt: "Viajes sorpresa en familia",
  },
  {
    key: "group",
    title: "Group",
    href: "/packages/by-type/group",
    img: "/images/journey-types/group-card.jpg",
    alt: "Viajes sorpresa en grupo",
  },
  {
    key: "honeymoon",
    title: "Honeymoon",
    href: "/packages/by-type/honeymoon",
    img: "/images/journey-types/honeymoon-card.jpg",
    alt: "Viajes sorpresa honeymoon",
  },
  {
    key: "paws",
    title: "Paws",
    href: "/packages/by-type/paws",
    img: "/images/journey-types/paws-card.jpg",
    alt: "Viajes con mascotas",
  },
];

export default function ByTravellerRow() {
  return (
    <div className="relative w-full overflow-x-auto lg:overflow-visible">
      <ul className="flex items-stretch gap-0 lg:justify-center [--overlap:-2rem] lg:[--overlap:-3rem]">
        {travellers.map((t, idx) => (
          <li
            key={t.key}
            className="group relative transition-transform duration-300 ease-out will-change-transform hover:z-20 focus-within:z-20 hover:-translate-y-2 first:ml-0"
            style={{ marginLeft: idx === 0 ? 0 : "var(--overlap)" }}
          >
            <Link
              href={t.href}
              className="block relative h-72 w-56 lg:h-80 lg:w-64 rounded-2xl overflow-hidden shadow-md ring-1 ring-black/10 transition-[box-shadow,transform] duration-300 group-hover:shadow-2xl"
              aria-label={t.title}
            >
              <Image
                src={t.img}
                alt={t.alt}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 75vw, (max-width: 1024px) 40vw, 16rem"
                priority={t.priority}
              />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
              <div className="absolute inset-x-0 bottom-0 p-4">
                <span className="inline-flex rounded-xl bg-black/60 px-3 py-1 text-white text-sm font-semibold">
                  {t.title}
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}