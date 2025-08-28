'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function ErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  useEffect(() => {
    // Clear the error from URL after showing it
    if (error) {
      const url = new URL(window.location.href);
      url.searchParams.delete('error');
      window.history.replaceState({}, '', url.toString());
    }
  }, [error]);

  const getErrorContent = () => {
    switch (error) {
      case 'OAuthAccountNotLinked':
        return {
          title: 'Account Already Exists',
          description:
            'An account with this email already exists. Please sign in using the method you originally used to create your account.',
          action: 'Try signing in with email/password instead',
          actionLink: '/auth/login',
        };
      case 'AccessDenied':
        return {
          title: 'Access Denied',
          description: 'You do not have permission to access this resource.',
          action: 'Go back to home',
          actionLink: '/',
        };
      default:
        return {
          title: 'Authentication Error',
          description:
            'An error occurred during authentication. Please try again.',
          action: 'Try again',
          actionLink: '/auth/login',
        };
    }
  };

  const errorContent = getErrorContent();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-red-600">
              {errorContent.title}
            </CardTitle>
            <CardDescription className="text-center">
              {errorContent.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertDescription>{errorContent.description}</AlertDescription>
            </Alert>

            <div className="flex flex-col space-y-2">
              <Button asChild className="w-full">
                <Link href={errorContent.actionLink}>
                  {errorContent.action}
                </Link>
              </Button>

              <Button variant="outline" asChild className="w-full">
                <Link href="/">Back to Home</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
