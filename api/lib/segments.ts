import { prisma } from "./db";

// Customer segment criteria. Stored as JSON on the Campaign row so the same
// criteria can be re-evaluated later if needed.
export interface SegmentCriteria {
  hasService?: string;       // package slug present in any job
  noVisitForDays?: number;   // last completedAt older than N days OR never visited
  minLifetimeCents?: number; // sum of paid invoices ≥ this
}

export async function findSegment(criteria: SegmentCriteria): Promise<string[]> {
  // Pull all customer-role users plus the data we need for filtering.
  const users = await prisma.user.findMany({
    where: { role: "customer" },
    select: {
      id: true,
      jobs: {
        select: { services: true, completedAt: true },
        orderBy: { completedAt: "desc" },
      },
      invoices: {
        select: { paidCents: true, status: true },
      },
    },
  });

  const cutoff = criteria.noVisitForDays != null
    ? new Date(Date.now() - criteria.noVisitForDays * 24 * 60 * 60 * 1000)
    : null;

  return users
    .filter((u) => {
      if (criteria.hasService) {
        const has = u.jobs.some((j) => j.services.includes(criteria.hasService!));
        if (!has) return false;
      }
      if (cutoff) {
        const lastVisit = u.jobs.find((j) => j.completedAt)?.completedAt ?? null;
        if (lastVisit && lastVisit > cutoff) return false;
      }
      if (criteria.minLifetimeCents != null) {
        const lifetime = u.invoices.reduce((s, inv) => s + inv.paidCents, 0);
        if (lifetime < criteria.minLifetimeCents) return false;
      }
      return true;
    })
    .map((u) => u.id);
}
