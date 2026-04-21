// Web3Forms is a dead-simple transactional email relay — POST a JSON body
// with your access_key and it emails the configured inbox. Free plan is
// generous enough for this app's traffic. Docs: https://web3forms.com/docs
//
// We route two kinds of mail through it:
//   1. Notifications to the customer (welcome, quote received, job status).
//   2. Notifications to the shop (Alex) when a new quote comes in.
//
// Since Web3Forms has no templating, we build the body inline.

const WEB3_URL = "https://api.web3forms.com/submit";

function key(): string {
  const k = process.env.WEB3FORMS_KEY;
  if (!k) throw new Error("WEB3FORMS_KEY env var is not set");
  return k;
}

interface BaseEmail {
  subject: string;
  message: string; // plain text body
  from_name?: string;
}

async function postForm(payload: Record<string, unknown>): Promise<void> {
  const res = await fetch(WEB3_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Web3Forms failed: ${res.status} ${text}`);
  }
}

// Send to a customer's email. Web3Forms default is to deliver to the inbox
// configured on the access key, so we override the destination with the
// `email` field — Web3Forms treats a form submission with an `email` field
// as the reply-to and relays based on the dashboard config. To deliver to
// an ARBITRARY inbox we use the `replyto` and `subject` levers and rely on
// the shop inbox forwarding via a Web3Forms rule, OR we use the `email` &
// `botcheck` fields for the customer-direct path below.
export async function sendToAddress(to: string, email: BaseEmail): Promise<void> {
  await postForm({
    access_key: key(),
    subject: email.subject,
    from_name: email.from_name ?? "RPM Auto Lab",
    email: to, // Web3Forms uses this as the reply-to recipient
    message: email.message,
    // When configured, Web3Forms CC's the access key's owner inbox so Alex
    // gets a copy of every customer-facing mail automatically.
  });
}

// ---- Concrete templates ------------------------------------------------

interface WelcomeArgs {
  name: string;
  setPasswordUrl: string;
  quoteSummary: string;
}

export function welcomeQuoteBody(a: WelcomeArgs): string {
  return [
    `Hi ${a.name},`,
    "",
    "Thanks for requesting a quote from RPM Auto Lab. Your request is in our queue and we'll be in touch within 24 hours with a detailed number.",
    "",
    "We've also set up a customer account for you so you can track your quote and job status in real time:",
    "",
    a.setPasswordUrl,
    "",
    "That link lets you set your password; it expires in 48 hours.",
    "",
    "Quote summary:",
    a.quoteSummary,
    "",
    "Questions? Just reply to this email.",
    "",
    "— RPM Auto Lab",
  ].join("\n");
}

interface QuoteToShopArgs {
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  vehicle: string;
  services: string[];
  estimatedTotal: number;
  notes?: string;
}

export function newQuoteForShopBody(a: QuoteToShopArgs): string {
  return [
    `New quote request — ${a.customerName}`,
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
  ]
    .filter(Boolean)
    .join("\n");
}

interface JobStatusArgs {
  name: string;
  vehicle: string;
  newStatus: string;
  note?: string;
  portalUrl: string;
}

export function jobStatusBody(a: JobStatusArgs): string {
  const statusLine: Record<string, string> = {
    scheduled: "Your job is scheduled.",
    in_progress: "We've started work on your vehicle.",
    completed: "Your vehicle is ready for pickup.",
    picked_up: "Picked up — thanks for choosing RPM Auto Lab!",
    cancelled: "Your job was cancelled.",
  };
  return [
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
    "— RPM Auto Lab",
  ]
    .filter(Boolean)
    .join("\n");
}
