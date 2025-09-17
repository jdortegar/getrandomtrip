'use client';

import { useMemo } from 'react';
import { useUserStore } from '@/store/slices/userStore';
import { useScrollDetection } from '@/hooks/useScrollDetection';
import EnhancedAuthModal from '@/components/auth/EnhancedAuthModal';
import { NavbarBrand } from './NavbarBrand';
import { NavbarSearch } from './NavbarSearch';
import { NavbarLinks } from './NavbarLinks';
import { NavbarMenu } from './NavbarMenu';
import { NavbarProfile } from './NavbarProfile';
import { NavbarActions } from './NavbarActions';
import { NAVBAR_CONSTANTS, NAVBAR_STYLES } from '@/lib/data/constants/navbar';
import type { NavbarProps } from './navbar.types';

export default function Navbar({ variant = 'auto' }: NavbarProps) {
  const overlay = useScrollDetection({ variant });
  const { isAuthed, user, signOut, openAuth, session } = useUserStore();

  const headerClass = useMemo(() => {
    const isSolid = variant === 'solid' || (variant === 'auto' && !overlay);
    return isSolid ? NAVBAR_STYLES.SOLID : NAVBAR_STYLES.OVERLAY;
  }, [overlay, variant]);

  return (
    <>
      <header
        data-site-header
        style={{ height: 'auto' }}
        className={headerClass}
      >
        <nav
          className={`mx-auto ${NAVBAR_CONSTANTS.HEIGHT} ${NAVBAR_CONSTANTS.MAX_WIDTH} ${NAVBAR_CONSTANTS.PADDING} flex items-center justify-between`}
        >
          <NavbarBrand isOverlay={overlay} />

          <div className="hidden md:flex items-center gap-6 text-sm font-medium">
            <NavbarSearch isOverlay={overlay} />
            <NavbarLinks />
            <NavbarMenu />
          </div>

          <div className="flex items-center gap-4">
            <NavbarActions isAuthed={isAuthed} onAuthClick={openAuth} />

            {isAuthed && user && (
              <NavbarProfile
                user={user}
                session={session}
                onSignOut={signOut}
              />
            )}
          </div>
        </nav>
      </header>

      {!overlay && (
        <div aria-hidden className={NAVBAR_CONSTANTS.SPACER_HEIGHT} />
      )}
      <EnhancedAuthModal />
    </>
  );
}
