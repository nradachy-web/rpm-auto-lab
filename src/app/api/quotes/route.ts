import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { vehicle, services, contact } = body;

    if (!vehicle?.year || !vehicle?.make || !vehicle?.model) {
      return Response.json(
        { success: false, message: "Vehicle information is required" },
        { status: 400 }
      );
    }

    if (!services || services.length === 0) {
      return Response.json(
        { success: false, message: "At least one service must be selected" },
        { status: 400 }
      );
    }

    if (!contact?.name || !contact?.email || !contact?.phone) {
      return Response.json(
        { success: false, message: "Name, email, and phone are required" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contact.email)) {
      return Response.json(
        { success: false, message: "Invalid email format" },
        { status: 400 }
      );
    }

    // TODO: Save to database with Prisma
    console.log("Quote submission:", JSON.stringify(body, null, 2));

    return Response.json({
      success: true,
      message: "Quote received! We'll be in touch within 24 hours.",
    });
  } catch {
    return Response.json(
      { success: false, message: "Invalid request body" },
      { status: 400 }
    );
  }
}
