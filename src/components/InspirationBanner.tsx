import Img from '@/components/common/Img';
import Section from '@/components/layout/Section';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface InspirationBannerProps {
  image: string;
  imageAlt?: string;
  eyebrow?: string;
  labelText?: string;
  title: string;
  subtitle?: string;
  buttonText?: string;
  buttonHref: string;
  profileImage?: string;
  profileInitial?: string;
  className?: string;
  layout?: 'default' | 'centered' | 'split';
}

export default function InspirationBanner({
  image,
  imageAlt = 'Inspiration banner',
  eyebrow,
  labelText,
  title,
  subtitle,
  buttonText,
  buttonHref,
  className,
}: InspirationBannerProps) {

  return (
    <Section className={cn('!text-left !py-12 md:!py-16 ', className)}>
      {/* Label */}
      {labelText && (
          <Label
            className="absolute translate-x-12 z-10 -translate-y-1/2"
            text={labelText}
          />
        )}
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
              <Button
                asChild
                size="md"
                className="text-md"
                variant="outline"
              >
                <Link href={buttonHref}>{buttonText}</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </Section>
  );
}
