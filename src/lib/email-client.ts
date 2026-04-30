// Web3Forms only accepts submissions from a real browser on the free plan
// (Cloudflare blocks server-side calls). So all transactional sends fire
// from the client. The access key is intentionally public; security comes
// from the allowed-origins config in the Web3Forms dashboard, which must
// be locked to nradachy-web.github.io.

const WEB3_URL = "https://api.web3forms.com/submit";
const WEB3_KEY = "303522ac-eb15-45ea-9ba6-a6c1796aad8b";

interface BaseEmail {
  subject: string;
  message: string;
  from_name?: string;
}

async function send(to: string, email: BaseEmail): Promise<void> {
  const res = await fetch(WEB3_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      access_key: WEB3_KEY,
      subject: email.subject,
      from_name: email.from_name ?? "RPM Auto Lab",
      email: to,
      message: email.message,
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Web3Forms ${res.status}: ${text}`);
  }
}

interface WelcomeArgs {
  to: string;
  name: string;
  setPasswordUrl?: string | null;
  quoteSummary: string;
  portalUrl: string;
}

export async function sendWelcomeQuote(a: WelcomeArgs): Promise<void> {
  const lines: string[] = [
    `Hi ${a.name},`,
    "",
    "Thanks for requesting a quote from RPM Auto Lab. Your request is in our queue and we'll be in touch within 24 hours with a detailed number.",
    "",
  ];
  if (a.setPasswordUrl) {
    lines.push(
      "We've also set up a customer account for you so you can track your quote and job status in real time:",
      "",
      a.setPasswordUrl,
      "",
      "That link lets you set your password; it expires in 48 hours.",
      "",
    );
  } else {
    lines.push(
      `Track this quote in your portal: ${a.portalUrl}`,
      "",
    );
  }
  lines.push(
    "Quote summary:",
    a.quoteSummary,
    "",
    "Questions? Just reply to this email.",
    "",
    "RPM Auto Lab",
  );
  await send(a.to, { subject: "Your RPM Auto Lab quote request", message: lines.join("\n") });
}

interface AdminAlertArgs {
  to: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  vehicle: string;
  services: string[];
  estimatedTotal: number;
  notes?: string;
}

export async function sendAdminQuoteAlert(a: AdminAlertArgs): Promise<void> {
  const lines = [
    `New quote request from ${a.customerName}`,
    "",
    `Vehicle: ${a.vehicle}`,
    `Services: ${a.services.join(", ")}`,
    `Estimated: $${a.estimatedTotal.toLocaleString()}`,
    "",
    `Customer: ${a.customerName}`,
    `Email: ${a.customerEmail}`,
    a.customerPhone ? `Phone: ${a.customerPhone}` : "",
    "",
    a.notes ? `Notes: ${a.notes}` : "",
  ].filter(Boolean);
  await send(a.to, {
    subject: `New quote ${a.customerName} ${a.vehicle}`,
    message: lines.join("\n"),
  });
}

interface JobStatusArgs {
  to: string;
  name: string;
  vehicle: string;
  newStatus: string;
  note?: string;
  portalUrl: string;
}

export async function sendJobStatus(a: JobStatusArgs): Promise<void> {
  const statusLine: Record<string, string> = {
    scheduled: "Your job is scheduled.",
    in_progress: "We've started work on your vehicle.",
    completed: "Your vehicle is ready for pickup.",
    picked_up: "Picked up. Thanks for choosing RPM Auto Lab!",
    cancelled: "Your job was cancelled.",
  };
  const lines = [
    `Hi ${a.name},`,
    "",
    statusLine[a.newStatus] ?? `Status update: ${a.newStatus}.`,
    `Vehicle: ${a.vehicle}`,
    "",
    a.note ? `Note from the shop: ${a.note}` : "",
    "",
    "Track progress here:",
    a.portalUrl,
    "",
    "RPM Auto Lab",
  ].filter(Boolean);
  await send(a.to, {
    subject: `Status update for your ${a.vehicle}`,
    message: lines.join("\n"),
  });
}

interface ReminderArgs {
  to: string;
  name: string;
  vehicle: string;
  type: "ceramic_refresh" | "ppf_check" | "tint_warranty" | "general_rebook" | "promotional" | "review_request";
  customMessage?: string | null;
  portalUrl: string;
  jobId?: string;
  googleReviewUrl?: string;
}

export async function sendReminderEmail(a: ReminderArgs): Promise<void> {
  const reviewLinkInternal = a.jobId
    ? `https://nradachy-web.github.io/rpm-auto-lab/portal/review?job=${encodeURIComponent(a.jobId)}`
    : a.portalUrl;
  const subjectMap: Record<ReminderArgs["type"], string> = {
    ceramic_refresh: "Time for a ceramic refresh on your " + a.vehicle,
    ppf_check: "PPF wash & inspection — your " + a.vehicle,
    tint_warranty: "Window tint warranty check — your " + a.vehicle,
    general_rebook: "We miss your " + a.vehicle + " — book your next visit",
    promotional: "A note from RPM Auto Lab",
    review_request: "How did we do on your " + a.vehicle + "?",
  };
  const reviewLines: string[] = [
    `Hi ${a.name},`,
    "",
    `Thanks for trusting us with your ${a.vehicle}. If you have a minute, we'd love to hear how it went.`,
    "",
    `Quick rating: ${reviewLinkInternal}`,
  ];
  if (a.googleReviewUrl) {
    reviewLines.push("", `Or leave a Google review (huge help to us): ${a.googleReviewUrl}`);
  }
  reviewLines.push("", "RPM Auto Lab");
  const bodyMap: Record<ReminderArgs["type"], string> = {
    ceramic_refresh: `Hi ${a.name},\n\nIt's been about six months since we coated your ${a.vehicle}. A maintenance refresh keeps the gloss strong and the warranty current.\n\nReply to this email or book a visit at: ${a.portalUrl}\n\nRPM Auto Lab`,
    ppf_check: `Hi ${a.name},\n\nIt's been about a month since we installed PPF on your ${a.vehicle}. Bring it in for a complimentary wash and edge inspection.\n\nBook a visit: ${a.portalUrl}\n\nRPM Auto Lab`,
    tint_warranty: `Hi ${a.name},\n\nQuick reminder that your window tint on the ${a.vehicle} is covered by warranty. If you've noticed any bubbling or peeling, let us know.\n\nReply to this email or open your portal: ${a.portalUrl}\n\nRPM Auto Lab`,
    general_rebook: `Hi ${a.name},\n\nIt's been a while since your last service on the ${a.vehicle}. We'd love to have you back. Want a wash, decon, or a top-up?\n\nBook a visit: ${a.portalUrl}\n\nRPM Auto Lab`,
    promotional: `Hi ${a.name},\n\n${a.customMessage ?? "We've got a new promotion running this month."}\n\nBook a visit: ${a.portalUrl}\n\nRPM Auto Lab`,
    review_request: reviewLines.join("\n"),
  };
  await send(a.to, { subject: subjectMap[a.type], message: bodyMap[a.type] });
}

// Where the customer portal lives. Used in email links.
export const CUSTOMER_PORTAL_URL = "https://nradachy-web.github.io/rpm-auto-lab/portal/dashboard";

// Where Alex receives quote alerts.
export const SHOP_INBOX = "alexmackris@rpmautolab.com";
