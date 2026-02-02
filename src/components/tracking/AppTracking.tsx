'use client';

import { useEffect } from 'react';
import Script from 'next/script';
import { usePathname, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { trackPageview, setUser } from '@/lib/helpers/tracking/gtm';
import { GTM_ID } from '@/lib/constants/tracking/service-keys';

const isDev =
  typeof process !== 'undefined' && process.env.NODE_ENV !== 'production';

function AppTracking() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  useEffect(() => {
    const url = `${pathname}${
      searchParams?.toString() ? `?${searchParams}` : ''
    }`;
    trackPageview(url);

    if (session?.user?.id) {
      setUser(session.user.id);
    }
  }, [pathname, searchParams, session?.user?.id]);

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
