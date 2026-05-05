import { withCors, json } from "@/lib/cors";

export const runtime = "nodejs";

// Server-side proxy for Google Places autocomplete. Keeps the API key
// off the client bundle (the key would otherwise be exposed in the JS
// bundle and could be abused). Restrict the key in Google Cloud to
// these APIs only: Places API (New), Geocoding API.
export const GET = withCors(async (req) => {
  const key = process.env.GOOGLE_API_KEY;
  if (!key) return json({ error: "Google API key not configured." }, { status: 503 });
  const url = new URL(req.url);
  const input = (url.searchParams.get("q") || "").trim();
  if (input.length < 3) return json({ predictions: [] });

  // Use the new Places API "autocomplete" endpoint. Bias to US.
  const res = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": key,
    },
    body: JSON.stringify({
      input,
      languageCode: "en",
      regionCode: "US",
      includedRegionCodes: ["us"],
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return json({ error: `Places ${res.status}: ${text.slice(0, 200)}` }, { status: 502 });
  }
  const body = await res.json() as { suggestions?: Array<{ placePrediction?: { placeId?: string; text?: { text?: string }; structuredFormat?: { mainText?: { text?: string }; secondaryText?: { text?: string } } } }> };
  const predictions = (body.suggestions ?? [])
    .map((s) => s.placePrediction)
    .filter((p): p is NonNullable<typeof p> => Boolean(p && p.placeId))
    .map((p) => ({
      placeId: p.placeId!,
      description: p.text?.text ?? "",
      mainText: p.structuredFormat?.mainText?.text ?? "",
      secondaryText: p.structuredFormat?.secondaryText?.text ?? "",
    }));
  return json({ predictions });
});

export const OPTIONS = withCors(async () => new Response(null, { status: 204 }));
