import { isProductionDeployment } from "@/lib/deployment";
import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  if (!isProductionDeployment() && !/^(sk|rk)_test_/.test(key)) {
    throw new Error("Only Stripe test keys are allowed outside production");
  }
  if (!_stripe) {
    _stripe = new Stripe(key, { apiVersion: "2026-04-22.dahlia" });
  }
  return _stripe;
}
