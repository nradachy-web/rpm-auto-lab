import { withCors, json } from "@/lib/cors";
import { currentUser } from "@/lib/auth";

export const runtime = "nodejs";

export const GET = withCors(async () => {
  const user = await currentUser();
  if (!user) return json({ user: null });
  return json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
    },
  });
});

export const OPTIONS = withCors(async () => new Response(null, { status: 204 }));
