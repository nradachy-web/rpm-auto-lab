// Reminder rules: when a job is marked completed, schedule follow-ups based
// on the services performed. The admin dashboard fires these client-side
// once the dueAt has passed (Web3Forms blocks server-side sends on free).

import type { ReminderType } from "@prisma/client";

interface Rule {
  type: ReminderType;
  daysOut: number;
  triggerServices?: string[]; // service IDs that trigger this rule; absent = always
}

// Service IDs come from src/lib/constants.ts on the frontend; keep this in
// sync. We match loosely so renaming a service doesn't break enqueue.
const RULES: Rule[] = [
  { type: "ppf_check", daysOut: 30, triggerServices: ["ppf", "paint-protection-film", "Paint Protection Film"] },
  { type: "tint_warranty", daysOut: 90, triggerServices: ["tint", "window-tint", "Window Tint"] },
  { type: "ceramic_refresh", daysOut: 180, triggerServices: ["ceramic-coating", "Ceramic Coating"] },
  { type: "general_rebook", daysOut: 90 }, // always
];

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

export function rulesForServices(services: string[]): Rule[] {
  const have = new Set(services.map(norm));
  return RULES.filter((r) => {
    if (!r.triggerServices) return true;
    return r.triggerServices.some((t) => have.has(norm(t)));
  });
}
