import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';

interface WaitlistDict {
  adminLoginLabel: string;
  emailPlaceholder: string;
  headline: string;
  lastNamePlaceholder: string;
  loginModal: {
    description: string;
    passwordPlaceholder: string;
    submitButton: string;
    title: string;
    usernamePlaceholder: string;
  };
  namePlaceholder: string;
  subheadline: string;
  submitButton: string;
  successMessage: string;
}

interface WaitlistPageProps {
  dict: WaitlistDict;
  onOpenLogin: () => void;
}

export function WaitlistPage({ dict, onOpenLogin }: WaitlistPageProps) {
  const [email, setEmail] = useState('');
  const [lastName, setLastName] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setIsLoading(true);
    setStatus('idle');
    try {
      const res = await fetch('/api/waitlist', {
        body: JSON.stringify({
          email: email.trim(),
          lastName: lastName.trim(),
          name: name.trim(),
        }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      });
      if (res.ok) {
        setStatus('success');
        setEmail('');
        setLastName('');
        setName('');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="grid h-screen grid-cols-1 md:grid-cols-2">
      <div className="flex min-w-0 items-center justify-center py-4 md:py-6">
        <img
          alt="RandomTrip"
          className="h-24 w-auto md:h-32 lg:h-40"
          src="/assets/svg/randomtrip.svg"
        />
      </div>
      <div className="flex min-w-0 flex-col justify-center px-6 py-4 md:px-12 md:py-6 lg:px-16 xl:px-24">
        <div className="mx-auto w-full max-w-md">
          <h1 className="font-barlow-condensed text-3xl font-bold uppercase leading-none tracking-wide text-foreground md:text-4xl lg:text-5xl">
            {dict.headline}
          </h1>
          <p className="mt-4 text-muted-foreground md:text-lg">
            {dict.subheadline}
          </p>
          {status !== 'success' && (
            <form className="mt-8 flex flex-col gap-4" onSubmit={handleSubmit}>
              <Input
                className="w-full"
                disabled={isLoading}
                onChange={(e) => setName(e.target.value)}
                placeholder={dict.namePlaceholder}
                type="text"
                value={name}
              />
              <Input
                className="w-full"
                disabled={isLoading}
                onChange={(e) => setLastName(e.target.value)}
                placeholder={dict.lastNamePlaceholder}
                type="text"
                value={lastName}
              />
              <Input
                className="w-full"
                disabled={isLoading}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={dict.emailPlaceholder}
                required
                type="email"
                value={email}
              />
              <Button
                className="w-full font-barlow-condensed font-semibold uppercase tracking-wide"
                disabled={isLoading}
                size="lg"
                type="submit"
              >
                {isLoading ? '...' : dict.submitButton}
              </Button>
            </form>
          )}
          {status === 'success' && (
            <p className="mt-4 text-sm font-medium text-green-600 dark:text-green-400">
              {dict.successMessage}
            </p>
          )}
          {status === 'error' && (
            <p className="mt-4 text-sm font-medium text-destructive">
              Something went wrong. Please try again.
            </p>
          )}
          <Button
            className="mt-8 underline normal-case font-barlow text-base"
            onClick={onOpenLogin}
            type="button"
            variant="link"
          >
            {dict.adminLoginLabel}
          </Button>
        </div>
      </div>
    </section>
  );
}
