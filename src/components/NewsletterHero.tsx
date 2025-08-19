'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

import { type NewsletterHero as NewsletterHeroType } from '@/lib/types';

interface NewsletterHeroProps {
  data: NewsletterHeroType;
}

export function NewsletterHero({ data }: NewsletterHeroProps) {
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Newsletter signup:', email);
    // Handle newsletter signup logic here
  };

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="hidden md:block">
          <div className="relative rounded-2xl overflow-hidden shadow-xl">
            <div
              className="absolute inset-0 bg-center bg-cover bg-no-repeat"
              style={{ backgroundImage: `url(${data.backgroundImage})` }}
            />
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

            <div className="relative z-10 p-12">
              <div className="max-w-2xl">
                <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
                  {data.title}
                </h2>
                <p className="text-lg text-white/90 mb-8">{data.subtitle}</p>

                <form onSubmit={handleSubmit} className="flex gap-4 mb-4">
                  <Input
                    type="email"
                    placeholder={data.placeholder}
                    value={email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEmail(e.target.value)
                    }
                    className="flex-1 bg-white/95 backdrop-blur-sm border-0 text-gray-900 placeholder-gray-500 rounded-lg"
                    required
                  />
                  <Button
                    type="submit"
                    className="bg-pink-600 hover:bg-pink-700 text-white font-bold px-8 py-3 rounded-lg"
                  >
                    {data.buttonText}
                  </Button>
                </form>

                <p className="text-sm text-white/80">
                  {data.disclaimer}{' '}
                  <a
                    href="#"
                    className="underline hover:text-white transition-colors"
                  >
                    {data.privacyLink}
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="md:hidden">
          <Card className="relative overflow-hidden shadow-xl">
            <div
              className="absolute inset-0 bg-center bg-cover bg-no-repeat"
              style={{ backgroundImage: `url(${data.backgroundImage})` }}
            />
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

            <div className="relative z-10 p-6">
              <h2 className="text-2xl font-bold text-white mb-3">
                {data.title}
              </h2>
              <p className="text-base text-white/90 mb-6">{data.subtitle}</p>

              <form onSubmit={handleSubmit} className="space-y-4 mb-4">
                <Input
                  type="email"
                  placeholder={data.placeholder}
                  value={email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEmail(e.target.value)
                  }
                  className="w-full bg-white/95 backdrop-blur-sm border-0 text-gray-900 placeholder-gray-500 rounded-lg"
                  required
                />
                <Button
                  type="submit"
                  className="w-full bg-pink-600 hover:bg-pink-700 text-white font-bold py-3 rounded-lg"
                >
                  {data.buttonText}
                </Button>
              </form>

              <p className="text-xs text-white/80">
                {data.disclaimer}{' '}
                <a
                  href="#"
                  className="underline hover:text-white transition-colors"
                >
                  {data.privacyLink}
                </a>
              </p>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
