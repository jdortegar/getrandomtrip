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
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [hasChecked, setHasChecked] = useState(false);

  const userRole = ((session?.user as any)?.role || user?.role) as string | undefined;

  useEffect(() => {
    if (!isAuthed) {
      // Open auth modal using the user store
      const { openAuth } = useUserStore.getState();
      openAuth('signin');
      return;
    }
    
    // Only redirect if we have a role and it's NOT tripper
    // Don't redirect if role is still loading (null)
    if (userRole && !hasRoleAccess(userRole, 'tripper')) {
      router.replace('/dashboard');
    } else if (hasRoleAccess(userRole, 'tripper') || (isAuthed && !userRole && session?.user)) {
      // User is a tripper or session is loading, allow access
      setHasChecked(true);
    }
  }, [isAuthed, userRole, router, pathname, session?.user]);

  // Show nothing while checking or if not authenticated
  if (!isAuthed || (!hasChecked && !userRole)) {
    return null;
  }

  // If we have a role and it's not tripper, show nothing (redirecting)
  if (userRole && !hasRoleAccess(userRole, 'tripper')) {
    return null;
  }

  // Only render if user is a tripper
  if (!hasRoleAccess(userRole, 'tripper')) {
    return null;
  }

  return <>{children}</>;
}
