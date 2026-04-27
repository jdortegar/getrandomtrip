import { loadStripe } from '@stripe/stripe-js';

/**
 * Module-level singleton — import this instead of calling loadStripe() in components
 * to avoid re-initializing Stripe on every render.
 */
export const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
);
