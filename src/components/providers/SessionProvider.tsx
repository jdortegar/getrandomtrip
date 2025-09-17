'use client';

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';
import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useUserStore, type UserRole } from '@/store/slices/userStore';

function SessionSync() {
  const { data: session, status } = useSession();
  const { setSession, signOut } = useUserStore();

  useEffect(() => {
    if (status === 'loading') return; // Don't update while loading

    if (session?.user) {
      // Convert NextAuth session to our user format
      const user = {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: session.user.role as UserRole,
        handle: (session.user as any).handle,
        avatar: (session.user as any).avatar,
        prefs: {
          interests: [],
          dislikes: [],
        },
      };

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
