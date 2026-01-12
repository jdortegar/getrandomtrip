import Img from '@/components/common/Img';
import Section from '@/components/layout/Section';
import { cn } from '@/lib/utils';

interface InspirationBannerProps {
  image: string;
  imageAlt?: string;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  buttonText?: string;
  buttonHref?: string;
  onButtonClick?: () => void;
  profileImage?: string;
  profileInitial?: string;
  className?: string;
  layout?: 'default' | 'centered' | 'split';
}

export default function InspirationBanner({
  image,
  imageAlt = 'Inspiration banner',
  eyebrow,
  title,
  subtitle,
  buttonText,
  buttonHref,
  onButtonClick,
  className,
}: InspirationBannerProps) {
  const handleButtonClick = () => {
    if (onButtonClick) {
      onButtonClick();
    }
  };

  const buttonContent = (
    <button
      className="mt-4 inline-flex items-center gap-2 rounded-full border border-white px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white transition-colors hover:bg-white hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800 md:text-sm"
      onClick={handleButtonClick}
      type="button"
    >
      {buttonText}
    </button>
  );

  return (
    <Section className={cn('!text-left !py-12 md:!py-16 ', className)}>
      <div className="relative w-full overflow-hidden rounded-2xl min-h-[300px] items-center flex">
        {/* Background Image */}
        <div className="absolute inset-0">
          <Img
            alt={imageAlt}
            className="h-full w-full object-cover"
            height={500}
            src={image}
            width={1200}
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />

        {/* Content Overlay */}
        <div
          className={cn(
            'relative z-10 flex w-full items-center justify-between p-6 text-white md:p-12',
          )}
        >
          {/* Left Side - Text Content */}
          <div className="flex flex-col gap-3 md:gap-2">
            {eyebrow && (
              <span className="text-amber-300 text-xs font-semibold uppercase tracking-[0.4em]">
                {eyebrow}
              </span>
            )}

            <div className="flex items-center gap-3 md:gap-4">
              <h2 className="font-barlow-condensed text-2xl font-bold leading-tight text-white md:text-4xl">
                {title}
              </h2>
            </div>

            {subtitle && (
              <p className="font-barlow-condensed text-xl font-bold leading-tight text-white md:text-2xl">
                {subtitle}
              </p>
            )}
          </div>

          {/* Right Side - Button */}
          {buttonText && (
            <div className="flex items-center">
              {buttonHref ? (
                <a
                  className="mt-4 inline-flex items-center gap-2 rounded-full border border-white px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white transition-colors hover:bg-white hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800 md:text-sm"
                  href={buttonHref}
                >
                  {buttonText}
                </a>
              ) : (
                buttonContent
              )}
            </div>
          )}
        </div>
      </div>
    </Section>
  );
}
