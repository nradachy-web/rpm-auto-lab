import { withCors, json } from "@/lib/cors";
import { requireAdmin, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export const GET = withCors(async () => {
  try {
    await requireAdmin();
    const configured = Boolean(process.env.URABLE_API_TOKEN);
    const lastRun = await prisma.urableSyncRun.findFirst({ orderBy: { startedAt: "desc" } });
    const linkedCustomers = await prisma.user.count({ where: { urableId: { not: null } } });
    const linkedVehicles = await prisma.vehicle.count({ where: { urableId: { not: null } } });
    return json({
      configured,
      lastRun: lastRun ? {
        startedAt: lastRun.startedAt,
        finishedAt: lastRun.finishedAt,
        customersUpserted: lastRun.customersUpserted,
        itemsUpserted: lastRun.itemsUpserted,
        errorText: lastRun.errorText,
      } : null,
      linkedCustomers,
      linkedVehicles,
    });
  } catch (e) {
    if (e instanceof AuthError) return json({ error: e.code }, { status: e.code === "UNAUTHENTICATED" ? 401 : 403 });
    throw e;
  }
});

export const OPTIONS = withCors(async () => new Response(null, { status: 204 }));
