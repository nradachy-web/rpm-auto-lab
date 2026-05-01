import { withCors, json } from "@/lib/cors";

export const runtime = "nodejs";

// Free NHTSA vPIC VIN decoder. No auth, no rate limit per VIN, but we
// still gate by length to avoid wasted hops.
export const GET = withCors(async (req) => {
  const vin = new URL(req.url).pathname.split("/").pop() || "";
  if (vin.length < 11 || vin.length > 17) {
    return json({ error: "VIN must be 11–17 chars" }, { status: 400 });
  }
  try {
    const res = await fetch(
      `https://vpic.nhtsa.dot.gov/api/vehicles/decodevinvalues/${encodeURIComponent(vin)}?format=json`,
      { headers: { Accept: "application/json" } }
    );
    if (!res.ok) return json({ error: `NHTSA ${res.status}` }, { status: 502 });
    const body = await res.json() as { Results?: Array<Record<string, unknown>> };
    const r = body.Results?.[0] ?? {};
    const out = {
      year: parseInt(String(r["ModelYear"] || "")) || null,
      make: stringOrNull(r["Make"]),
      model: stringOrNull(r["Model"]),
      trim: stringOrNull(r["Trim"]) || stringOrNull(r["Series"]),
      bodyClass: stringOrNull(r["BodyClass"]),
      vehicleType: stringOrNull(r["VehicleType"]),
    };
    return json(out);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "VIN lookup failed" }, { status: 500 });
  }
});

function stringOrNull(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  if (!s || s.toLowerCase() === "not applicable" || s.toLowerCase() === "none") return null;
  return s;
}

export const OPTIONS = withCors(async () => new Response(null, { status: 204 }));
