'use client';

import { useCallback, useEffect, useState } from 'react';

import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';

interface LoginModalDict {
  description: string;
  passwordPlaceholder: string;
  submitButton: string;
  title: string;
  usernamePlaceholder: string;
}

interface LoginModalProps {
  dict: LoginModalDict;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  open: boolean;
}

/** Gate: client-only check so only users who know the code see the real home. Not real auth. */
const GATE_USERNAME = 'admin';
const GATE_PASSWORD = 'randomtrip2026';

export function LoginModal({
  dict,
  onOpenChange,
  onSuccess,
  open,
}: LoginModalProps) {
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = useCallback(() => {
    setError(null);
    setPassword('');
    setUsername('');
    onOpenChange(false);
  }, [onOpenChange]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    if (open) {
      document.addEventListener('keydown', onKeyDown);
      return () => document.removeEventListener('keydown', onKeyDown);
    }
  }, [open, handleClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) return;
    setIsLoading(true);
    setError(null);
    if (username.trim() === GATE_USERNAME && password === GATE_PASSWORD) {
      onSuccess();
      handleClose();
    } else {
      setError('Invalid credentials');
    }
    setIsLoading(false);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        className="relative w-full max-w-md rounded-lg border border-gray-200 bg-white p-8 shadow-2xl"
        role="dialog"
        aria-labelledby="login-modal-title"
        aria-modal="true"
      >
        <button
          aria-label="Close"
          className="absolute right-4 top-4 rounded-md p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600"
          type="button"
          onClick={handleClose}
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-6">
          <h2
            className="text-2xl font-bold text-neutral-900"
            id="login-modal-title"
          >
            {dict.title}
          </h2>
          <p className="mt-2 text-sm text-neutral-600">{dict.description}</p>
        </div>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <Input
            autoComplete="username"
            disabled={isLoading}
            onChange={(e) => setUsername(e.target.value)}
            placeholder={dict.usernamePlaceholder}
            required
            type="text"
            value={username}
          />
          <Input
            autoComplete="current-password"
            disabled={isLoading}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={dict.passwordPlaceholder}
            required
            type="password"
            value={password}
          />
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          <Button
            className="w-full font-medium"
            disabled={isLoading}
            type="submit"
          >
            {isLoading ? '...' : dict.submitButton}
          </Button>
        </form>
      </div>
    </div>
  );
}
