'use client';

import { TravelHero } from '@/components/layout/TravelHero';
import { TravelButton } from '@/components/ui/TravelButton';
import {
  TravelCard,
  TravelCardHeader,
  TravelCardTitle,
  TravelCardDescription,
  TravelCardContent,
  TravelCardFooter,
} from '@/components/ui/TravelCard';

export default function TravelDesignSystemPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <TravelHero
        title="Luxury Travel Design System"
        subtitle="Inspired by Black Tomato"
        description="A comprehensive design system for creating beautiful, luxury travel experiences with adventure-themed components and sophisticated typography."
        variant="luxury"
        ctaText="Explore Components"
        className="mb-16"
      />

      {/* Typography Showcase */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">
            Typography System
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <h1 className="display-1 mb-4">Display Heading 1</h1>
                <p className="text-muted-foreground">
                  Perfect for hero sections and major titles
                </p>
              </div>

              <div>
                <h2 className="display-2 mb-4">Display Heading 2</h2>
                <p className="text-muted-foreground">
                  Great for section headers
                </p>
              </div>

              <div>
                <h3 className="text-hero mb-4">Hero Text Style</h3>
                <p className="text-muted-foreground">
                  Elegant serif for special content
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold mb-2">Standard H1</h1>
                <h2 className="text-2xl font-semibold mb-2">Standard H2</h2>
                <h3 className="text-xl font-semibold mb-2">Standard H3</h3>
                <p className="text-large mb-4">
                  Large body text for important content
                </p>
                <p className="text-body mb-4">
                  Regular body text for general content
                </p>
                <p className="text-small">
                  Small text for captions and details
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Button Showcase */}
      <section className="py-16 px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">
            Button Variants
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center space-y-4">
              <h3 className="font-semibold">Primary</h3>
              <TravelButton variant="secondary">Primary</TravelButton>
            </div>

            <div className="text-center space-y-4">
              <h3 className="font-semibold">Luxury</h3>
              <TravelButton variant="luxury">Luxury</TravelButton>
            </div>

            <div className="text-center space-y-4">
              <h3 className="font-semibold">Adventure</h3>
              <TravelButton variant="adventure">Adventure</TravelButton>
            </div>

            <div className="text-center space-y-4">
              <h3 className="font-semibold">Coastal</h3>
              <TravelButton variant="coastal">Coastal</TravelButton>
            </div>

            <div className="text-center space-y-4">
              <h3 className="font-semibold">Mountain</h3>
              <TravelButton variant="mountain">Mountain</TravelButton>
            </div>

            <div className="text-center space-y-4">
              <h3 className="font-semibold">Urban</h3>
              <TravelButton variant="urban">Urban</TravelButton>
            </div>

            <div className="text-center space-y-4">
              <h3 className="font-semibold">Outline</h3>
              <TravelButton variant="outline">Outline</TravelButton>
            </div>

            <div className="text-center space-y-4">
              <h3 className="font-semibold">Ghost</h3>
              <TravelButton variant="ghost">Ghost</TravelButton>
            </div>
          </div>
        </div>
      </section>

      {/* Card Showcase */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">Card Variants</h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <TravelCard variant="default">
              <TravelCardHeader>
                <TravelCardTitle>Default Card</TravelCardTitle>
                <TravelCardDescription>
                  A clean, minimal card design perfect for general content.
                </TravelCardDescription>
              </TravelCardHeader>
              <TravelCardContent>
                <p className="text-body">
                  This is the default card variant with subtle shadows and clean
                  borders.
                </p>
              </TravelCardContent>
              <TravelCardFooter>
                <TravelButton variant="secondary" size="sm">
                  Learn More
                </TravelButton>
              </TravelCardFooter>
            </TravelCard>

            <TravelCard variant="luxury">
              <TravelCardHeader>
                <TravelCardTitle>Luxury Card</TravelCardTitle>
                <TravelCardDescription>
                  Premium design with gradient backgrounds and enhanced shadows.
                </TravelCardDescription>
              </TravelCardHeader>
              <TravelCardContent>
                <p className="text-body">
                  Perfect for highlighting premium experiences and luxury
                  offerings.
                </p>
              </TravelCardContent>
              <TravelCardFooter>
                <TravelButton variant="luxury" size="sm">
                  Explore
                </TravelButton>
              </TravelCardFooter>
            </TravelCard>

            <TravelCard variant="adventure">
              <TravelCardHeader>
                <TravelCardTitle>Adventure Card</TravelCardTitle>
                <TravelCardDescription>
                  Bold design inspired by tropical adventures and desert
                  sunsets.
                </TravelCardDescription>
              </TravelCardHeader>
              <TravelCardContent>
                <p className="text-body">
                  Ideal for adventure travel packages and exciting experiences.
                </p>
              </TravelCardContent>
              <TravelCardFooter>
                <TravelButton variant="adventure" size="sm">
                  Adventure
                </TravelButton>
              </TravelCardFooter>
            </TravelCard>

            <TravelCard variant="coastal">
              <TravelCardHeader>
                <TravelCardTitle>Coastal Card</TravelCardTitle>
                <TravelCardDescription>
                  Ocean-inspired design with deep blues and teal accents.
                </TravelCardDescription>
              </TravelCardHeader>
              <TravelCardContent>
                <p className="text-body">
                  Perfect for beach destinations and coastal experiences.
                </p>
              </TravelCardContent>
              <TravelCardFooter>
                <TravelButton variant="coastal" size="sm">
                  Discover
                </TravelButton>
              </TravelCardFooter>
            </TravelCard>

            <TravelCard variant="mountain">
              <TravelCardHeader>
                <TravelCardTitle>Mountain Card</TravelCardTitle>
                <TravelCardDescription>
                  Nature-inspired design with rich greens and earthy tones.
                </TravelCardDescription>
              </TravelCardHeader>
              <TravelCardContent>
                <p className="text-body">
                  Great for mountain retreats and outdoor adventures.
                </p>
              </TravelCardContent>
              <TravelCardFooter>
                <TravelButton variant="mountain" size="sm">
                  Explore
                </TravelButton>
              </TravelCardFooter>
            </TravelCard>

            <TravelCard variant="urban">
              <TravelCardHeader>
                <TravelCardTitle>Urban Card</TravelCardTitle>
                <TravelCardDescription>
                  Modern design with charcoal and vibrant accent colors.
                </TravelCardDescription>
              </TravelCardHeader>
              <TravelCardContent>
                <p className="text-body">
                  Perfect for city breaks and urban experiences.
                </p>
              </TravelCardContent>
              <TravelCardFooter>
                <TravelButton variant="urban" size="sm">
                  Discover
                </TravelButton>
              </TravelCardFooter>
            </TravelCard>
          </div>
        </div>
      </section>

      {/* Color Palette Showcase */}
      <section className="py-16 px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">
            Travel Color Palettes
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Coastal Palette */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Coastal Escape</h3>
              <div className="grid grid-cols-5 gap-2">
                <div className="h-16 bg-coastal-deep rounded-lg"></div>
                <div className="h-16 bg-coastal-soft rounded-lg"></div>
                <div className="h-16 bg-coastal-sandy rounded-lg"></div>
                <div className="h-16 bg-coastal-crisp rounded-lg"></div>
                <div className="h-16 bg-coastal-teal rounded-lg"></div>
              </div>
              <p className="text-sm text-muted-foreground">
                Deep blues, soft pastels, and sandy beiges for serene coastal
                experiences.
              </p>
            </div>

            {/* Desert Palette */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Desert Sunset</h3>
              <div className="grid grid-cols-5 gap-2">
                <div className="h-16 bg-desert-earth rounded-lg"></div>
                <div className="h-16 bg-desert-gold rounded-lg"></div>
                <div className="h-16 bg-desert-peach rounded-lg"></div>
                <div className="h-16 bg-desert-red rounded-lg"></div>
                <div className="h-16 bg-desert-orange rounded-lg"></div>
              </div>
              <p className="text-sm text-muted-foreground">
                Warm earth tones and golden hues for desert adventures.
              </p>
            </div>

            {/* Mountain Palette */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Mountain Retreat</h3>
              <div className="grid grid-cols-5 gap-2">
                <div className="h-16 bg-mountain-rich rounded-lg"></div>
                <div className="h-16 bg-mountain-soft rounded-lg"></div>
                <div className="h-16 bg-mountain-earth rounded-lg"></div>
                <div className="h-16 bg-mountain-beige rounded-lg"></div>
                <div className="h-16 bg-mountain-forest rounded-lg"></div>
              </div>
              <p className="text-sm text-muted-foreground">
                Rich greens and earthy browns for mountain experiences.
              </p>
            </div>

            {/* Urban Palette */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Urban Vibes</h3>
              <div className="grid grid-cols-5 gap-2">
                <div className="h-16 bg-urban-charcoal rounded-lg"></div>
                <div className="h-16 bg-urban-vibrant rounded-lg"></div>
                <div className="h-16 bg-urban-lavender rounded-lg"></div>
                <div className="h-16 bg-urban-crisp rounded-lg"></div>
                <div className="h-16 bg-urban-taupe rounded-lg"></div>
              </div>
              <p className="text-sm text-muted-foreground">
                Sophisticated grays and vibrant accents for city experiences.
              </p>
            </div>

            {/* Tropical Palette */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Tropical Paradise</h3>
              <div className="grid grid-cols-5 gap-2">
                <div className="h-16 bg-tropical-coral rounded-lg"></div>
                <div className="h-16 bg-tropical-mint rounded-lg"></div>
                <div className="h-16 bg-tropical-yellow rounded-lg"></div>
                <div className="h-16 bg-tropical-white rounded-lg"></div>
                <div className="h-16 bg-tropical-teal rounded-lg"></div>
              </div>
              <p className="text-sm text-muted-foreground">
                Vibrant corals and mint greens for tropical getaways.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
