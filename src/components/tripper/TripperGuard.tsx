'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useUserStore } from '@/store/slices/userStore';
import { hasRoleAccess } from '@/lib/auth/roleAccess';

export default function TripperGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthed, user } = useUserStore();
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [hasChecked, setHasChecked] = useState(false);

  const sessionUser = session?.user as
    | { role?: string; roles?: Array<"admin" | "client" | "tripper"> }
    | undefined;

  const roleSubject =
    sessionUser?.roles && sessionUser.roles.length > 0
      ? { role: sessionUser.role, roles: sessionUser.roles }
      : user?.roles && user.roles.length > 0
        ? { role: user.role, roles: user.roles }
        : { role: sessionUser?.role ?? user?.role };

  const isTripper = hasRoleAccess(roleSubject, "tripper");

  useEffect(() => {
    if (!isAuthed) {
      // Open auth modal using the user store
      const { openAuth } = useUserStore.getState();
      openAuth('signin');
      return;
    }
    
    if (status === "loading") return;

    if (isTripper) {
      setHasChecked(true);
      return;
    }

    // If session is present but roles haven't hydrated yet, wait
    if (session?.user && !sessionUser?.roles && !user?.roles && !sessionUser?.role && !user?.role) {
      return;
    }

    router.replace("/dashboard");
  }, [isAuthed, isTripper, router, pathname, session?.user, sessionUser?.role, sessionUser?.roles, status, user?.role, user?.roles]);

  if (status === "loading" || !isAuthed) {
    return null;
  }

  // Show nothing while checking
  if (!hasChecked) {
    return null;
  }

  if (!isTripper) {
    return null;
  }

  return <>{children}</>;
}
