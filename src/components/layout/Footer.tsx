import Link from 'next/link';
import Img from '@/components/common/Img';
import { pathForLocale } from '@/lib/i18n/pathForLocale';
import type { Locale } from '@/lib/i18n/config';
import type { Dictionary } from '@/lib/i18n/dictionaries';

interface FooterProps {
  dict: Dictionary;
  locale: Locale;
}

export default function Footer({ dict, locale }: FooterProps) {
  const year = new Date().getFullYear();
  const f = dict.footer;

  return (
    <footer className="relative overflow-hidden bg-gray-900 text-white">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-gray-900/50 via-gray-800/30 to-gray-900/50" />
      <div className="pointer-events-none absolute left-0 top-0 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 rounded-full bg-blue-500/5 blur-3xl" />

      <div className="relative">
        <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        <div className="container mx-auto px-4 py-16">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-5">
            <div className="flex items-center justify-center">
              <Img
                alt={dict.common.siteName}
                height={40}
                src="/assets/logos/logo_getrandomtrip_white.png"
                width={240}
              />
            </div>

            <div>
              <h4 className="font-jost mb-6 text-sm font-semibold uppercase tracking-wider text-white">
                {f.quickLinksTitle}
              </h4>
              <ul className="space-y-3">
                <li>
                  <Link
                    className="font-jost text-sm text-gray-300/90 transition-colors hover:text-primary"
                    href={pathForLocale(locale, '/nosotros')}
                  >
                    {f.about}
                  </Link>
                </li>
                <li>
                  <Link
                    className="font-jost text-sm text-gray-300/90 transition-colors hover:text-primary"
                    href={pathForLocale(locale, '/how-it-works')}
                  >
                    {f.howItWorks}
                  </Link>
                </li>
                <li>
                  <Link
                    className="font-jost text-sm text-gray-300/90 transition-colors hover:text-primary"
                    href={pathForLocale(locale, '/blog')}
                  >
                    {f.inspiration}
                  </Link>
                </li>
                <li>
                  <Link
                    className="font-jost text-sm text-gray-300/90 transition-colors hover:text-primary"
                    href={pathForLocale(locale, '/faq')}
                  >
                    {f.faq}
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-jost mb-6 text-sm font-semibold uppercase tracking-wider text-white">
                {f.travelersTitle}
              </h4>
              <ul className="space-y-3">
                <li>
                  <Link
                    className="font-jost text-sm text-gray-300/90 transition-colors hover:text-primary"
                    href={pathForLocale(locale, '/packages/by-type/solo')}
                  >
                    {f.solo}
                  </Link>
                </li>
                <li>
                  <Link
                    className="font-jost text-sm text-gray-300/90 transition-colors hover:text-primary"
                    href={pathForLocale(locale, '/packages/by-type/couple')}
                  >
                    {f.couple}
                  </Link>
                </li>
                <li>
                  <Link
                    className="font-jost text-sm text-gray-300/90 transition-colors hover:text-primary"
                    href={pathForLocale(locale, '/packages/by-type/family')}
                  >
                    {f.family}
                  </Link>
                </li>
                <li>
                  <Link
                    className="font-jost text-sm text-gray-300/90 transition-colors hover:text-primary"
                    href={pathForLocale(locale, '/packages/by-type/group')}
                  >
                    {f.group}
                  </Link>
                </li>
                <li>
                  <Link
                    className="font-jost text-sm text-gray-300/90 transition-colors hover:text-primary"
                    href={pathForLocale(locale, '/packages/by-type/honeymoon')}
                  >
                    {f.honeymoon}
                  </Link>
                </li>
                <li>
                  <Link
                    className="font-jost text-sm text-gray-300/90 transition-colors hover:text-primary"
                    href={pathForLocale(locale, '/packages/by-type/paws')}
                  >
                    {f.paws}
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-jost mb-6 text-sm font-semibold uppercase tracking-wider text-white">
                {f.legalTitle}
              </h4>
              <ul className="space-y-3">
                <li>
                  <Link
                    className="font-jost text-sm text-gray-300/90 transition-colors hover:text-primary"
                    href={pathForLocale(locale, '/terms')}
                  >
                    {f.termsOfService}
                  </Link>
                </li>
                <li>
                  <Link
                    className="font-jost text-sm text-gray-300/90 transition-colors hover:text-primary"
                    href={pathForLocale(locale, '/privacy')}
                  >
                    {f.privacyPolicy}
                  </Link>
                </li>
                <li>
                  <Link
                    className="font-jost text-sm text-gray-300/90 transition-colors hover:text-primary"
                    href={pathForLocale(locale, '/cookies')}
                  >
                    {f.cookiePolicy}
                  </Link>
                </li>
                <li>
                  <Link
                    className="font-jost text-sm text-gray-300/90 transition-colors hover:text-primary"
                    href={pathForLocale(locale, '/refund')}
                  >
                    {f.refundPolicy}
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-jost mb-6 text-sm font-semibold uppercase tracking-wider text-white">
                {f.contactTitle}
              </h4>
              <ul className="space-y-3">
                <li>
                  <Link
                    className="font-jost text-sm text-gray-300/90 transition-colors hover:text-primary"
                    href={pathForLocale(locale, '/contact')}
                  >
                    {f.contact}
                  </Link>
                </li>
                <li>
                  <Link
                    className="font-jost text-sm text-gray-300/90 transition-colors hover:text-primary"
                    href={pathForLocale(locale, '/support')}
                  >
                    {f.support}
                  </Link>
                </li>
              </ul>

              <div className="mt-8 flex gap-4">
                <a
                  aria-label={f.ariaFacebook}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/5 backdrop-blur-sm transition-all duration-300 hover:border-white/40 hover:bg-white/10"
                  href="https://facebook.com"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <svg
                    className="h-5 w-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>
                <a
                  aria-label={f.ariaInstagram}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/5 backdrop-blur-sm transition-all duration-300 hover:border-white/40 hover:bg-white/10"
                  href="https://instagram.com"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <svg
                    className="h-5 w-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </a>
                <a
                  aria-label={f.ariaTwitter}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/5 backdrop-blur-sm transition-all duration-300 hover:border-white/40 hover:bg-white/10"
                  href="https://twitter.com"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <svg
                    className="h-5 w-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10">
          <div className="container mx-auto px-4 py-6">
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
              <p className="font-caveat text-center text-lg text-gray-400">
                {f.tagline}
              </p>
              <p className="font-jost text-sm text-gray-400">
                © {year} {dict.common.siteName}. {f.copyright}
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
