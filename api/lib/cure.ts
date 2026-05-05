// Cure-window calculator. Given a list of service slugs, return the cure
// kind name and the number of HOURS the customer should avoid washing /
// touching / rolling-down-windows-on the vehicle.

const HOURS_BY_KIND: Record<string, { kind: string; hours: number }> = {
  "paint-protection-film": { kind: "ppf", hours: 48 },
  "ppf": { kind: "ppf", hours: 48 },
  "ceramic-coating": { kind: "ceramic-coating", hours: 168 }, // 7 days no wash
  "vehicle-wraps": { kind: "vehicle-wraps", hours: 72 },
  "window-tint": { kind: "window-tint", hours: 96 },          // ~4 days; tint cures longer in cold
  "tint": { kind: "window-tint", hours: 96 },
  "windshield-protection": { kind: "windshield-protection", hours: 48 },
};

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9-]/g, "-");

export function computeCure(services: string[], completedAt: Date): { cureUntil: Date | null; cureKind: string | null } {
  let longest = 0;
  let kind: string | null = null;
  for (const s of services) {
    const rule = HOURS_BY_KIND[s] || HOURS_BY_KIND[norm(s)];
    if (rule && rule.hours > longest) {
      longest = rule.hours;
      kind = rule.kind;
    }
  }
  if (longest === 0) return { cureUntil: null, cureKind: null };
  return {
    cureUntil: new Date(completedAt.getTime() + longest * 60 * 60 * 1000),
    cureKind: kind,
  };
}
