
import Link from "next/link";
import AssetImage from "@/components/AssetImage";

type Props = {
  href: string;
  title: string;
  imgSrc: string;
};

export default function BitacoraCountryCard({ href, title, imgSrc }: Props) {
  return (
    <Link href={href} className="block">
      <div className="relative rounded-lg overflow-hidden h-64 group cursor-pointer">
        <AssetImage
          srcPrimary={imgSrc}                // p.ej. /images/bitacoras/argentina.jpg
          countryName={title}               // "Argentina"
          alt={`Imagen de ${title}`}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          className="object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors duration-300" />
        <div className="absolute bottom-0 left-0 p-4">
          <h3 className="text-white text-2xl font-bold" style={{ fontFamily: '"Playfair Display", serif' }}>
            {title}
          </h3>
        </div>
      </div>
    </Link>
  );
}
