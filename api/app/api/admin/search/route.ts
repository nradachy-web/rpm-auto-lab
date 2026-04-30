import { withCors, json } from "@/lib/cors";
import { requireAdmin, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export const GET = withCors(async (req) => {
  try {
    await requireAdmin();
    const url = new URL(req.url);
    const q = (url.searchParams.get("q") || "").trim();
    if (q.length < 2) return json({ customers: [], vehicles: [], jobs: [], quotes: [], invoices: [] });

    const term = q;
    const [customers, vehicles, jobs, quotes, invoices] = await Promise.all([
      prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: term, mode: "insensitive" } },
            { email: { contains: term, mode: "insensitive" } },
            { phone: { contains: term } },
            { referralCode: { contains: term, mode: "insensitive" } },
          ],
        },
        take: 12,
        select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true },
      }),
      prisma.vehicle.findMany({
        where: {
          OR: [
            { make: { contains: term, mode: "insensitive" } },
            { model: { contains: term, mode: "insensitive" } },
            { trim: { contains: term, mode: "insensitive" } },
            { color: { contains: term, mode: "insensitive" } },
            { licensePlate: { contains: term, mode: "insensitive" } },
            { vin: { contains: term, mode: "insensitive" } },
          ],
        },
        take: 12,
        include: { user: { select: { id: true, name: true } } },
      }),
      prisma.job.findMany({
        where: {
          OR: [
            { adminNote: { contains: term, mode: "insensitive" } },
            { services: { has: term.toLowerCase() } },
            { user: { name: { contains: term, mode: "insensitive" } } },
            { vehicle: { make: { contains: term, mode: "insensitive" } } },
            { vehicle: { model: { contains: term, mode: "insensitive" } } },
          ],
        },
        take: 12,
        include: {
          user: { select: { id: true, name: true } },
          vehicle: { select: { year: true, make: true, model: true } },
        },
      }),
      prisma.quote.findMany({
        where: {
          OR: [
            { notes: { contains: term, mode: "insensitive" } },
            { services: { has: term.toLowerCase() } },
            { user: { name: { contains: term, mode: "insensitive" } } },
          ],
        },
        take: 12,
        include: {
          user: { select: { id: true, name: true } },
          vehicle: { select: { year: true, make: true, model: true } },
        },
      }),
      prisma.invoice.findMany({
        where: {
          OR: [
            { number: { contains: term, mode: "insensitive" } },
            { user: { name: { contains: term, mode: "insensitive" } } },
          ],
        },
        take: 12,
        include: { user: { select: { id: true, name: true } } },
      }),
    ]);

    return json({ customers, vehicles, jobs, quotes, invoices });
  } catch (e) {
    if (e instanceof AuthError) return json({ error: e.code }, { status: e.code === "UNAUTHENTICATED" ? 401 : 403 });
    throw e;
  }
});

export const OPTIONS = withCors(async () => new Response(null, { status: 204 }));
