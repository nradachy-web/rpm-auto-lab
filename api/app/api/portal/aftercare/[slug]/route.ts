import { withCors } from "@/lib/cors";
import { buildAftercarePdf } from "@/lib/aftercare";

export const runtime = "nodejs";

// Public — anyone with the link can download. The aftercare guide isn't
// sensitive (no customer data unless requested via query params).
export const GET = withCors(async (req) => {
  const url = new URL(req.url);
  const slug = url.pathname.split("/").pop() || "";
  const customerName = url.searchParams.get("name") || undefined;
  const vehicle = url.searchParams.get("vehicle") || undefined;
  try {
    const { bytes, filename } = await buildAftercarePdf({
      serviceSlug: slug,
      customerName,
      vehicle,
      installedAt: new Date(),
    });
    return new Response(bytes as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
      },
    });
  } catch (e) {
    return new Response(e instanceof Error ? e.message : "Aftercare not available", { status: 404 });
  }
});

export const OPTIONS = withCors(async () => new Response(null, { status: 204 }));
