import { withCors, json } from "@/lib/cors";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export const GET = withCors(async () => {
  const user = await currentUser();
  if (!user) return json({ error: "UNAUTHENTICATED" }, { status: 401 });
  const invoices = await prisma.invoice.findMany({
    where: { userId: user.id, status: { in: ["sent", "partial", "paid"] } },
    orderBy: { createdAt: "desc" },
    include: {
      lineItems: { orderBy: { sortOrder: "asc" } },
      payments: { orderBy: { receivedAt: "desc" } },
      job: { include: { vehicle: true } },
    },
  });
  return json({ invoices });
});

export const OPTIONS = withCors(async () => new Response(null, { status: 204 }));
