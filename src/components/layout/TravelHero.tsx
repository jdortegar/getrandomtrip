'use client';

import { cn } from '@/lib/utils';
import { TravelButton } from '@/components/ui/TravelButton';

interface TravelHeroProps {
  title: string;
  subtitle?: string;
  description?: string;
  backgroundImage?: string;
  overlay?: boolean;
  variant?:
    | 'default'
    | 'luxury'
    | 'adventure'
    | 'coastal'
    | 'mountain'
    | 'urban';
  ctaText?: string;
  ctaHref?: string;
  onCtaClick?: () => void;
  className?: string;
}

export function TravelHero({
  title,
  subtitle,
  description,
  backgroundImage,
  overlay = true,
  variant = 'default',
  ctaText = 'Get Started',
  ctaHref,
  onCtaClick,
  className,
}: TravelHeroProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'luxury':
        return 'from-primary/80 to-primary-900/80';
      case 'adventure':
        return 'from-tropical-coral/80 to-desert-orange/80';
      case 'coastal':
        return 'from-coastal-deep/80 to-coastal-teal/80';
      case 'mountain':
        return 'from-mountain-rich/80 to-mountain-forest/80';
      case 'urban':
        return 'from-urban-charcoal/80 to-urban-vibrant/80';
      default:
        return 'from-black/40 to-black/60';
    }
  };

  const getButtonVariant = () => {
    switch (variant) {
      case 'luxury':
        return 'luxury';
      case 'adventure':
        return 'adventure';
      case 'coastal':
        return 'coastal';
      case 'mountain':
        return 'mountain';
      case 'urban':
        return 'urban';
      default:
        return 'primary';
    }
  };

  return (
    <section
      className={cn(
        'relative min-h-screen flex items-center justify-center overflow-hidden',
        className,
      )}
    >
      {/* Background Image */}
      {backgroundImage && (
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${backgroundImage})` }}
        />
      )}

      {/* Overlay */}
      {overlay && (
        <div
          className={cn(
            'absolute inset-0 bg-gradient-to-br',
            getVariantStyles(),
          )}
        />
      )}

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center text-white">
        {subtitle && (
          <p className="text-lg md:text-xl font-medium mb-4 opacity-90">
            {subtitle}
          </p>
        )}

        <h1 className="display-1 text-white mb-6">{title}</h1>

        {description && (
          <p className="text-large text-white/90 mb-8 max-w-2xl mx-auto">
            {description}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <TravelButton
            variant={getButtonVariant()}
            size="lg"
            onClick={onCtaClick}
            className="min-w-[200px]"
          >
            {ctaText}
          </TravelButton>

          {ctaHref && (
            <TravelButton
              variant="outline"
              size="lg"
              className="min-w-[200px] border-white text-white hover:bg-white hover:text-gray-900"
            >
              Learn More
            </TravelButton>
          )}
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white rounded-full mt-2 animate-pulse" />
        </div>
      </div>
    </section>
  );
}
