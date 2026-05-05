// Urable API client + sync. Today their public API exposes only Customers
// and Items (vehicles), so that's all we mirror. Schema is documented at
// https://api.urable.com/. Token is stored in URABLE_API_TOKEN.

import { prisma } from "./db";

const BASE = "https://app.urable.com/api/v1";

interface UrablePhone { label?: string | null; value: string }
interface UrableEmail { label?: string | null; value: string }

export interface UrableCustomer {
  id: string;
  type: string;
  status?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
  phoneNumberValues?: string[];
  phoneNumber?: UrablePhone | null;
  phoneNumbers?: UrablePhone[];
  email?: UrableEmail | null;
  emails?: UrableEmail[];
  notes?: string | null;
  amountSpent?: number;
  origin?: string | null;
  itemNames?: string[];
  created?: { uid: string | null; timestamp: number };
  modified?: { uid: string | null; timestamp: number };
}

interface UrableItemMetadata {
  year?: string | number | null;
  make?: string | null;
  model?: string | null;
  trim?: string | null;
  submodel?: string | null;
  vins?: string[];
  licensePlates?: string[];
  factoryColor?: { name?: string | null; rgb?: string | null };
}

export interface UrableItem {
  id: string;
  name: string;
  type: string;            // "automotive"
  industry: string;        // "vehicleCare"
  customerRef: string;     // "accounts/<acctId>/customers/<customerId>"
  customerName?: string | null;
  metadata: UrableItemMetadata;
  notes?: string | null;
  photoURL?: string | null;
  created?: { uid: string | null; timestamp: number };
  modified?: { uid: string | null; timestamp: number };
}

interface ListResponse<T> { success: boolean; data: T[]; nextCursor?: string | null }

function token(): string {
  const t = process.env.URABLE_API_TOKEN;
  if (!t) throw new Error("URABLE_API_TOKEN not set");
  return t;
}

async function urableFetch<T>(path: string): Promise<T> {
  const r = await fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${token()}`, Accept: "application/json" },
  });
  if (!r.ok) {
    const text = await r.text().catch(() => "");
    throw new Error(`Urable ${r.status} on ${path}: ${text.slice(0, 200)}`);
  }
  return r.json() as Promise<T>;
}

// ───────────── Public API used by routes ─────────────

export async function listAllUrableCustomers(): Promise<UrableCustomer[]> {
  return collect<UrableCustomer>("/customers");
}
export async function listAllUrableItems(): Promise<UrableItem[]> {
  return collect<UrableItem>("/items");
}

async function collect<T>(path: string): Promise<T[]> {
  const out: T[] = [];
  let cursor: string | null = null;
  // Cap at 50 pages to defend against runaway loops.
  for (let i = 0; i < 50; i++) {
    const sep = path.includes("?") ? "&" : "?";
    const qs = cursor ? `${sep}cursor=${encodeURIComponent(cursor)}` : "";
    const body = await urableFetch<ListResponse<T>>(`${path}${qs}`);
    out.push(...(body.data || []));
    cursor = body.nextCursor ?? null;
    if (!cursor) break;
  }
  return out;
}

// Pull the customerId from "accounts/<acctId>/customers/<customerId>"
function extractCustomerId(ref: string | null | undefined): string | null {
  if (!ref) return null;
  const m = ref.match(/customers\/([^/]+)/);
  return m ? m[1] : null;
}

// ───────────── Sync ─────────────

export async function runUrableSync(): Promise<{ customersUpserted: number; itemsUpserted: number }> {
  const run = await prisma.urableSyncRun.create({ data: {} });
  let customersUpserted = 0;
  let itemsUpserted = 0;
  try {
    const customers = await listAllUrableCustomers();
    for (const c of customers) {
      const email = c.email?.value || c.emails?.[0]?.value || `urable-${c.id}@no-email.local`;
      const phone = c.phoneNumber?.value || c.phoneNumberValues?.[0] || null;
      const fullName = c.name || [c.firstName, c.lastName].filter(Boolean).join(" ").trim() || "Unnamed";

      // Match strategy: prefer urableId; otherwise email; otherwise create.
      const existingByUrable = await prisma.user.findFirst({ where: { urableId: c.id } });
      if (existingByUrable) {
        await prisma.user.update({
          where: { id: existingByUrable.id },
          data: { name: fullName, phone, notes: c.notes ?? existingByUrable.notes },
        });
      } else {
        const existingByEmail = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
        if (existingByEmail) {
          await prisma.user.update({
            where: { id: existingByEmail.id },
            data: { urableId: c.id, name: existingByEmail.name || fullName, phone: existingByEmail.phone || phone },
          });
        } else {
          await prisma.user.create({
            data: {
              email: email.toLowerCase(),
              name: fullName,
              phone,
              role: "customer",
              urableId: c.id,
              notes: c.notes,
            },
          });
        }
      }
      customersUpserted++;
    }

    // Vehicles (Urable items).
    const items = await listAllUrableItems();
    for (const it of items) {
      const customerId = extractCustomerId(it.customerRef);
      if (!customerId) continue;
      const owner = await prisma.user.findFirst({ where: { urableId: customerId } });
      if (!owner) continue; // skip orphans; will pick up on next run after the customer syncs

      const yearRaw = it.metadata?.year;
      const year = typeof yearRaw === "number" ? yearRaw : parseInt(String(yearRaw || "0")) || 0;
      const make = it.metadata?.make ?? "Unknown";
      const model = it.metadata?.model ?? "Unknown";
      const trim = it.metadata?.trim ?? it.metadata?.submodel ?? null;
      const vin = it.metadata?.vins?.[0] ?? null;
      const plate = it.metadata?.licensePlates?.[0] ?? null;
      const color = it.metadata?.factoryColor?.name ?? null;

      const existing = await prisma.vehicle.findFirst({ where: { urableId: it.id } });
      if (existing) {
        await prisma.vehicle.update({
          where: { id: existing.id },
          data: { year, make, model, trim, vin, licensePlate: plate, color, notes: it.notes ?? existing.notes },
        });
      } else {
        await prisma.vehicle.create({
          data: {
            userId: owner.id,
            year, make, model, trim, vin, licensePlate: plate, color,
            notes: it.notes,
            urableId: it.id,
          },
        });
      }
      itemsUpserted++;
    }

    await prisma.urableSyncRun.update({
      where: { id: run.id },
      data: { finishedAt: new Date(), customersUpserted, itemsUpserted },
    });
    return { customersUpserted, itemsUpserted };
  } catch (e) {
    await prisma.urableSyncRun.update({
      where: { id: run.id },
      data: { finishedAt: new Date(), customersUpserted, itemsUpserted, errorText: String(e).slice(0, 500) },
    });
    throw e;
  }
}
