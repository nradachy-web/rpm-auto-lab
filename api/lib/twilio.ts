// Tiny Twilio wrapper that calls the REST API directly (no SDK). All
// functions are graceful no-ops when env vars are missing — the rest of the
// app must continue working without SMS configured.

const TWILIO_BASE = "https://api.twilio.com/2010-04-01/Accounts";

function isConfigured(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_PHONE_NUMBER,
  );
}

function normalize(phone: string): string | null {
  const digits = phone.replace(/[^\d+]/g, "");
  if (!digits) return null;
  if (digits.startsWith("+")) return digits;
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return null;
}

export async function sendSms(to: string, body: string): Promise<{ ok: boolean; reason?: string }> {
  if (!isConfigured()) return { ok: false, reason: "SMS not configured" };
  const normalized = normalize(to);
  if (!normalized) return { ok: false, reason: "Invalid phone number" };
  const sid = process.env.TWILIO_ACCOUNT_SID!;
  const token = process.env.TWILIO_AUTH_TOKEN!;
  const from = process.env.TWILIO_PHONE_NUMBER!;
  const url = `${TWILIO_BASE}/${sid}/Messages.json`;
  const auth = Buffer.from(`${sid}:${token}`).toString("base64");
  const params = new URLSearchParams({ To: normalized, From: from, Body: body });
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { ok: false, reason: `Twilio ${res.status}: ${text.slice(0, 200)}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: e instanceof Error ? e.message : "Unknown" };
  }
}

export const SMS_TEMPLATES = {
  jobStatus(args: { name: string; vehicle: string; newStatus: string; portalUrl: string }): string {
    const lines: Record<string, string> = {
      scheduled: `Hi ${args.name}, your ${args.vehicle} is scheduled with RPM Auto Lab. Track it: ${args.portalUrl}`,
      in_progress: `Hi ${args.name}, we've started work on your ${args.vehicle}. Live updates: ${args.portalUrl}`,
      completed: `Hi ${args.name}, your ${args.vehicle} is ready for pickup at RPM Auto Lab.`,
      picked_up: `Thanks for trusting RPM Auto Lab with your ${args.vehicle}, ${args.name}!`,
      cancelled: `Hi ${args.name}, your ${args.vehicle} job at RPM Auto Lab has been cancelled. Please contact us with questions.`,
    };
    return lines[args.newStatus] ?? `Update on your ${args.vehicle}: ${args.newStatus}`;
  },
};
