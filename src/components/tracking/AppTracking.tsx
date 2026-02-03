'use client';

import { useEffect, useRef } from 'react';
import Script from 'next/script';
import { usePathname, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  setUser,
  trackPageview,
  trackScrollDepth,
} from '@/lib/helpers/tracking/gtm';
import { GTM_ID } from '@/lib/constants/tracking/service-keys';

const isDev =
  typeof process !== 'undefined' && process.env.NODE_ENV !== 'production';

const SCROLL_DEPTH_MILESTONES = [25, 50, 75, 90, 100] as const;

function AppTracking() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const reachedMilestones = useRef<Set<number>>(new Set());
  const currentPathKey = useRef<string | null>(null);

  useEffect(() => {
    const url = `${pathname}${
      searchParams?.toString() ? `?${searchParams}` : ''
    }`;
    trackPageview(url);

    if (session?.user?.id) {
      setUser(session.user.id);
    }
  }, [pathname, searchParams, session?.user?.id]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const pathKey = `${pathname}${searchParams?.toString() ?? ''}`;
    if (currentPathKey.current !== pathKey) {
      currentPathKey.current = pathKey;
      reachedMilestones.current = new Set();
    }

    const pagePath = `${pathname}${
      searchParams?.toString() ? `?${searchParams}` : ''
    }`;

    const handleScroll = () => {
      const { scrollY, innerHeight } = window;
      const { scrollHeight } = document.documentElement;
      const scrollBottom = scrollY + innerHeight;
      const percent = Math.round((scrollBottom / scrollHeight) * 100);

      for (const milestone of SCROLL_DEPTH_MILESTONES) {
        if (percent >= milestone && !reachedMilestones.current.has(milestone)) {
          reachedMilestones.current.add(milestone);
          trackScrollDepth(milestone, pagePath);
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [pathname, searchParams]);

  if (!GTM_ID || isDev) return null;

  return (
    <>
      <Script
        id="gtm-script"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${GTM_ID}');
          `,
        }}
      />
      <noscript>
        <iframe
          height="0"
          src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
          style={{ display: 'none', visibility: 'hidden' }}
          width="0"
        />
      </noscript>
    </>
  );
}

export default AppTracking;
