import Stripe from "stripe";

let _client: Stripe | null = null;

export function getStripe(): Stripe {
  if (_client) return _client;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  // Pin to the SDK's default apiVersion to avoid type mismatches across versions.
  _client = new Stripe(key);
  return _client;
}

// Default deposit ratio applied when admin doesn't specify a custom amount.
export const DEFAULT_DEPOSIT_RATIO = 0.25;
