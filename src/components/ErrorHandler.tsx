'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function ErrorHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const error = searchParams.get('error');

  useEffect(() => {
    if (error) {
      // Redirect to error page
      router.push(`/error?error=${error}`);
    }
  }, [error, router]);

  if (!error) {
    return null;
  }

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md">
      <Alert variant="destructive">
        <AlertDescription>
          {error === 'OAuthAccountNotLinked'
            ? 'Account already exists. Please sign in with your original method.'
            : 'Authentication error occurred. Please try again.'}
        </AlertDescription>
      </Alert>
    </div>
  );
}
