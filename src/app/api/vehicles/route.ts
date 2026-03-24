import { NextRequest } from "next/server";

const NHTSA_BASE = "https://vpic.nhtsa.dot.gov/api/vehicles";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const year = searchParams.get("year");
  const make = searchParams.get("make");

  try {
    if (type === "makes") {
      const res = await fetch(
        `${NHTSA_BASE}/GetMakesForVehicleType/car?format=json`,
        { next: { revalidate: 86400 } }
      );
      const data = await res.json();
      const makes: string[] = data.Results.map(
        (r: { MakeName: string }) => r.MakeName
      ).sort((a: string, b: string) => a.localeCompare(b));

      return Response.json(
        { makes },
        {
          headers: {
            "Cache-Control":
              "public, s-maxage=86400, stale-while-revalidate=43200",
          },
        }
      );
    }

    if (type === "models" && make && year) {
      const res = await fetch(
        `${NHTSA_BASE}/GetModelsForMakeYear/make/${encodeURIComponent(make)}/modelyear/${year}?format=json`,
        { next: { revalidate: 86400 } }
      );
      const data = await res.json();
      const models: string[] = data.Results.map(
        (r: { Model_Name: string }) => r.Model_Name
      ).sort((a: string, b: string) => a.localeCompare(b));

      return Response.json(
        { models },
        {
          headers: {
            "Cache-Control":
              "public, s-maxage=86400, stale-while-revalidate=43200",
          },
        }
      );
    }

    return Response.json(
      { error: "Invalid request. Use ?type=makes or ?type=models&make=X&year=Y" },
      { status: 400 }
    );
  } catch {
    return Response.json(
      { error: "Failed to fetch vehicle data" },
      { status: 500 }
    );
  }
}
