import Link from 'next/link';
import {
  Heart,
  HelpCircle,
  Home,
  MapPin,
  Plane,
  Users,
} from 'lucide-react';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { getLocaleFromCookies } from '@/lib/i18n/server';
import { pathForLocale } from '@/lib/i18n/pathForLocale';

export async function generateMetadata() {
  const locale = await getLocaleFromCookies();
  const dict = await getDictionary(locale);
  return {
    description: dict.notFound.metaDescription,
    title: dict.notFound.metaTitle,
  };
}

export default async function NotFoundPage() {
  const locale = await getLocaleFromCookies();
  const dict = await getDictionary(locale);
  const nf = dict.notFound;

  return (
    <div className="relative flex min-h-screen flex-col font-sans text-gray-900 antialiased bg-gray-50">
      {/* Background pattern + 404 content */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-12">
        <div className="absolute inset-0">
          <div className="absolute -right-40 -top-40 h-80 w-80 rounded-full bg-primary/10 opacity-30 mix-blend-multiply filter blur-xl animate-pulse" />
          <div
            className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-primary/5 opacity-30 mix-blend-multiply filter blur-xl animate-pulse"
            style={{ animationDelay: '2s' }}
          />
          <div
            className="absolute left-1/2 top-40 h-80 w-80 rounded-full bg-primary/8 opacity-30 mix-blend-multiply filter blur-xl animate-pulse"
            style={{ animationDelay: '4s' }}
          />
        </div>

        <div className="relative mx-auto w-full max-w-4xl">
            {/* Main Content Card */}
            <div className="bg-white rounded-3xl shadow-2xl border border-neutral-200 p-8 md:p-12 text-center">
              {/* 404 Number with Animation */}
              <div className="mb-8">
                <div className="relative inline-block">
                  <h1 className="text-8xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary/80 to-primary/60 animate-pulse">
                    404
                  </h1>
                  <div className="absolute inset-0 text-8xl md:text-9xl font-black text-primary/20 -z-10 blur-sm">
                    404
                  </div>
                </div>
              </div>

              {/* Icon with Animation */}
              <div className="mb-8">
                <div className="relative inline-block">
                  <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg animate-bounce">
                    <svg
                      className="w-10 h-10 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </div>
                  <div className="absolute inset-0 w-20 h-20 bg-primary rounded-full blur-md opacity-30 animate-ping"></div>
                </div>
              </div>

              {/* Title */}
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                {nf.title}
              </h2>

              {/* Subtitle */}
              <p className="text-lg text-gray-700 mb-8 max-w-2xl mx-auto leading-relaxed">
                {nf.subtitle}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                <Link
                  className="group relative px-8 py-4 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                  href={pathForLocale(locale, '/')}
                >
                  <Home className="w-5 h-5" />
                  <span className="relative z-10">{nf.goHome}</span>
                  <div className="absolute inset-0 bg-primary rounded-xl blur opacity-0 group-hover:opacity-75 transition-opacity duration-300"></div>
                </Link>

                <Link
                  className="group px-8 py-4 border-2 border-primary/20 text-primary rounded-xl font-semibold hover:bg-primary/5 hover:border-primary/30 transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2"
                  href={pathForLocale(locale, '/packages')}
                >
                  <Plane className="w-5 h-5" />
                  {nf.viewPackages}
                </Link>
              </div>

              {/* Quick Links */}
              <div className="border-t border-neutral-200 pt-8">
                <p className="text-sm text-gray-600 mb-4">
                  {nf.exploreSections}
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  <Link
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-primary/10 hover:text-primary transition-colors flex items-center gap-2"
                    href={pathForLocale(locale, '/packages/by-type/solo')}
                  >
                    <MapPin className="w-4 h-4" />
                    {nf.linkSolo}
                  </Link>
                  <Link
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-primary/10 hover:text-primary transition-colors flex items-center gap-2"
                    href={pathForLocale(locale, '/packages/by-type/couple')}
                  >
                    <Heart className="w-4 h-4" />
                    {nf.linkCouple}
                  </Link>
                  <Link
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-primary/10 hover:text-primary transition-colors flex items-center gap-2"
                    href={pathForLocale(locale, '/packages/by-type/family')}
                  >
                    <Users className="w-4 h-4" />
                    {nf.linkFamily}
                  </Link>
                  <Link
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-primary/10 hover:text-primary transition-colors flex items-center gap-2"
                    href={pathForLocale(locale, '/trippers')}
                  >
                    <Users className="w-4 h-4" />
                    {nf.linkTrippers}
                  </Link>
                </div>
              </div>

              {/* Fun Message */}
              <div className="mt-8 p-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl border border-primary/20">
                <p className="text-sm text-gray-700 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                  <span>
                    <strong>{nf.tipLabel}</strong> {nf.tipText}
                  </span>
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center mt-8">
              <p className="text-sm text-gray-600 flex items-center justify-center gap-2">
                <HelpCircle className="w-4 h-4" />
                {nf.needHelp}{' '}
                <Link
                  className="text-primary hover:text-primary/80 underline"
                  href={pathForLocale(locale, '/contact')}
                >
                  {nf.contactUs}
                </Link>
              </p>
            </div>
        </div>
      </div>
    </div>
  );
}
