'use client';

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';
import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useUserStore } from '@/store/slices/userStore';
import { mapSessionUserToStoreUser, type SessionUser } from '@/lib/types/SessionUser';

function SessionSync() {
  const { data: session, status } = useSession();
  const { setSession, signOut } = useUserStore();

  useEffect(() => {
    if (status === 'loading') return; // Don't update while loading

    if (session?.user) {
      const user = mapSessionUserToStoreUser(session.user as SessionUser);

      if (!user) {
        setSession({
          isAuthed: false,
          user: null,
          session: null,
          authModalOpen: false,
        });
        return;
      }

      setSession({
        isAuthed: true,
        user,
        session,
        authModalOpen: false,
      });
    } else {
      setSession({
        isAuthed: false,
        user: null,
        session: null,
        authModalOpen: false,
      });
    }
  }, [session, status, setSession]);

  // Handle sign out from NextAuth
  useEffect(() => {
    if (status === 'unauthenticated') {
      signOut();
    }
  }, [status, signOut]);

  return null; // This component doesn't render anything
}

interface SessionProviderProps {
  children: React.ReactNode;
}

export default function SessionProvider({ children }: SessionProviderProps) {
  return (
    <NextAuthSessionProvider>
      <SessionSync />
      {children}
    </NextAuthSessionProvider>
  );
}
