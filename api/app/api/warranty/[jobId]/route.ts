import { withCors, json } from "@/lib/cors";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

// Public warranty endpoint — anyone with the URL can view the warranty card.
// Acceptable since the data exposed is just vehicle make/model + service +
// install date + warranty length. No PII beyond first name.
export const GET = withCors(async (req) => {
  const id = new URL(req.url).pathname.split("/").pop() || "";
  if (!id) return json({ error: "Missing id" }, { status: 400 });
  const job = await prisma.job.findUnique({
    where: { id },
    include: {
      user: { select: { name: true } },
      vehicle: { select: { year: true, make: true, model: true, trim: true } },
    },
  });
  if (!job) return json({ error: "Not found" }, { status: 404 });
  if (job.status !== "completed" && job.status !== "picked_up") {
    return json({ error: "Warranty not yet active — job not completed." }, { status: 400 });
  }

  // Derive the longest applicable warranty from this job's services.
  const SERVICE_WARRANTY: Record<string, { name: string; years: number }> = {
    "ceramic-coating": { name: "Ceramic Coating", years: 5 },
    "paint-protection-film": { name: "Paint Protection Film", years: 10 },
    "window-tint": { name: "Window Tint", years: 99 },           // lifetime
    "vehicle-wraps": { name: "Vehicle Wrap", years: 5 },
    "windshield-protection": { name: "Windshield Protection", years: 2 },
  };

  const coverage = job.services
    .map((s) => SERVICE_WARRANTY[s])
    .filter((c): c is { name: string; years: number } => Boolean(c));

  const installedAt = job.completedAt ?? job.pickedUpAt ?? job.createdAt;
  return json({
    job: { id: job.id, services: job.services, status: job.status },
    customer: { firstName: (job.user.name || "").split(/\s+/)[0] || "Customer" },
    vehicle: job.vehicle,
    installedAt: installedAt.toISOString(),
    coverage,
  });
});

export const OPTIONS = withCors(async () => new Response(null, { status: 204 }));
