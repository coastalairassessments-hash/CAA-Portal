// The booking system checking itself, so Cory does not have to. Pure: every outside call is passed in.
export type Check = { name: string; ok: boolean; detail: string };

export type SelfCheckDeps = {
  fetchPage: (path: string) => Promise<{ status: number; text: string }>;
  loadSlots: () => Promise<unknown[]>;
  depositInvoice: () => Promise<{ link: boolean }>;
  emailConfigured: () => boolean;
};

async function run(name: string, fn: () => Promise<string>): Promise<Check> {
  try {
    return { name, ok: true, detail: await fn() };
  } catch (e) {
    return { name, ok: false, detail: e instanceof Error ? e.message : String(e) };
  }
}

export async function runSelfCheck(d: SelfCheckDeps): Promise<Check[]> {
  const page = (name: string, path: string, expect: string) =>
    run(name, async () => {
      const r = await d.fetchPage(path);
      if (r.status !== 200) throw new Error(`answered ${r.status}`);
      if (!r.text.includes(expect)) throw new Error(`did not show "${expect}"`);
      return "loads";
    });
  return Promise.all([
    page("Home page", "/", "Request a date"),
    page("Booking form", "/request", "Who are you?"),
    run("Calendar data", async () => `${(await d.loadSlots()).length} held times`),
    run("Deposit invoice", async () => ((await d.depositInvoice()).link ? "pay link works" : "works, no pay link (invoice is emailed)")),
    run("Email", async () => {
      if (!d.emailConfigured()) throw new Error("email is not set up");
      return "set up";
    }),
  ]);
}

// Null when everything passed. Otherwise one short message for Cory's phone.
export function failureMessage(checks: Check[]): string | null {
  const bad = checks.filter((c) => !c.ok);
  if (!bad.length) return null;
  return `Booking check failed: ${bad.map((c) => `${c.name} (${c.detail.slice(0, 160)})`).join("; ")}. Open More to look.`;
}
