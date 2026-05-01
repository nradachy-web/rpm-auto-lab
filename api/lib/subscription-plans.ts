// Catalog of recurring subscription offerings. Kept inline to avoid schema
// churn — these don't change often and aren't user-edited.

export interface SubscriptionPlan {
  slug: string;
  name: string;
  description: string;
  intervalDays: number;       // human-readable, also used for our DB row
  stripeInterval: "month" | "year";
  stripeIntervalCount: number;
  priceCents: number;         // per recurring charge
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    slug: "monthly-wash",
    name: "Monthly Maintenance Wash",
    description: "Hand wash + microfiber dry on the first of every month. Skip a month any time.",
    intervalDays: 30,
    stripeInterval: "month",
    stripeIntervalCount: 1,
    priceCents: 4900,
  },
  {
    slug: "quarterly-detail",
    name: "Quarterly Detail",
    description: "Full interior + exterior detail every 3 months. Keeps your coating fresh.",
    intervalDays: 90,
    stripeInterval: "month",
    stripeIntervalCount: 3,
    priceCents: 19900,
  },
];

export function planBySlug(slug: string): SubscriptionPlan | undefined {
  return SUBSCRIPTION_PLANS.find((p) => p.slug === slug);
}
