// SERVER ONLY. Takes the deposit on a Stripe Checkout page. Stripe uses one permanent key,
// so unlike QuickBooks there is no login that can lapse. Plain web calls, no extra package.
const clean = (v?: string) => v?.trim().replace(/^["']+|["']+$/g, "").trim();

export const isStripeId = (id: string | null | undefined) => !!id && id.startsWith("cs_");
export const stripeKey = () => clean(process.env.STRIPE_SECRET_KEY);
export const stripeConfigured = () => !!stripeKey();

async function call(path: string, form?: URLSearchParams): Promise<Record<string, unknown>> {
  const key = stripeKey();
  if (!key) throw new Error("Stripe is not set up (STRIPE_SECRET_KEY is missing)");
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: form ? "POST" : "GET",
    headers: { Authorization: `Bearer ${key}`, ...(form ? { "Content-Type": "application/x-www-form-urlencoded" } : {}) },
    body: form?.toString(),
    cache: "no-store",
  });
  const body = (await res.json().catch(() => ({}))) as Record<string, unknown> & { error?: { message?: string; code?: string } };
  if (!res.ok) {
    const why = [body.error?.code, body.error?.message].filter(Boolean).join(": ").slice(0, 200);
    console.error(`Stripe error ${res.status} ${path.split("/")[0]} ${why}`);
    throw new Error(`Stripe error ${res.status}${why ? ` - ${why}` : ""}`);
  }
  return body;
}

export function checkoutForm(o: {
  cents: number; description: string; email?: string; requestId?: string; successUrl: string; cancelUrl: string;
}): URLSearchParams {
  const f = new URLSearchParams({
    mode: "payment",
    "line_items[0][price_data][currency]": "usd",
    "line_items[0][price_data][unit_amount]": String(Math.round(o.cents)),
    "line_items[0][price_data][product_data][name]": o.description,
    "line_items[0][quantity]": "1",
    success_url: o.successUrl,
    cancel_url: o.cancelUrl,
    billing_address_collection: "required",
  });
  if (o.email) f.set("customer_email", o.email);
  if (o.requestId) {
    f.set("client_reference_id", o.requestId);
    f.set("metadata[request_id]", o.requestId);
  }
  return f;
}

export async function createCheckout(o: Parameters<typeof checkoutForm>[0]): Promise<{ id: string; url: string }> {
  const b = await call("checkout/sessions", checkoutForm(o));
  if (typeof b.id !== "string" || typeof b.url !== "string") throw new Error("Stripe gave no payment link");
  return { id: b.id, url: b.url };
}

export async function checkoutPaid(id: string): Promise<{ paid: boolean; expired: boolean }> {
  const b = await call(`checkout/sessions/${encodeURIComponent(id)}`);
  return { paid: b.payment_status === "paid", expired: b.status === "expired" };
}

// Closes an unpaid checkout so it cannot be paid later. Quietly fine if already closed.
export async function expireCheckout(id: string): Promise<void> {
  await call(`checkout/sessions/${encodeURIComponent(id)}/expire`, new URLSearchParams()).catch(() => undefined);
}

// Proves a client could pay: opens a $1 checkout and closes it again.
export async function testStripe(): Promise<void> {
  const made = await createCheckout({
    cents: 100, description: "Test, please ignore",
    successUrl: "https://book.coastalairassessments.com/", cancelUrl: "https://book.coastalairassessments.com/",
  });
  await expireCheckout(made.id);
}
