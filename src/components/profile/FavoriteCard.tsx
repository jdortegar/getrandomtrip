import Image from "next/image";
import Link from "next/link";

export default function FavoriteCard({ title, image, href }: { title: string; image: string; href: string }) {
  return (
    <Link href={href} className="block overflow-hidden rounded-2xl border border-neutral-200 shadow-sm hover:shadow-md dark:border-white/10">
      <div className="relative h-40 w-full">
        <Image src={image} alt="" fill className="object-cover" />
      </div>
      <div className="p-3 text-sm font-medium">{title}</div>
    </Link>
  );
}
