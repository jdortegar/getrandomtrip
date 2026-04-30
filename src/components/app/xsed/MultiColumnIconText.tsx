import Img from "@/components/common/Img";
import type { XsedPageDict } from "@/lib/types/dictionary";

interface MultiColumnIconTextProps {
  content: XsedPageDict["iconText"];
}

const ICONS: Record<XsedPageDict["iconText"]["items"][number]["icon"], string> =
  {
    alert: "/assets/icons/alert.svg",
    escape: "/assets/icons/escape.svg",
    rhythm: "/assets/icons/rhythm.svg",
  };

export function MultiColumnIconText({ content }: MultiColumnIconTextProps) {
  return (
    <section className="bg-[#D97E4A] py-20 text-white">
      <div className="container mx-auto px-4 md:px-20">
        <div className="grid grid-cols-1 gap-14 md:grid-cols-3 md:gap-16">
          {content.items.map((item) => (
            <article
              className="mx-auto flex max-w-xs flex-col items-center text-center"
              key={item.title}
            >
              <Img
                alt=""
                aria-hidden="true"
                className="mb-5 h-12 w-auto"
                height={60}
                src={ICONS[item.icon]}
                width={67}
              />
              <h2 className="mb-6 font-barlow text-base font-bold text-white">
                {item.title}
              </h2>
              <p
                className="font-barlow text-sm font-normal leading-loose text-white/90 [&_strong]:font-bold [&_strong]:text-white"
                dangerouslySetInnerHTML={{ __html: item.description }}
              />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
