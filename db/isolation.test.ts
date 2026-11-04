// Real-database tests: can one client, or a stranger, ever reach another client's data?
// Runs against a local Supabase (see .github/workflows/db.yml). Skipped on a laptop with no database,
// but CI sets DB_TESTS_REQUIRED=1 so a missing database fails the build instead of passing silently.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const url = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ready = Boolean(url && anonKey && serviceKey);

if (!ready && process.env.DB_TESTS_REQUIRED === "1") {
  throw new Error("DB_TESTS_REQUIRED is set but the local Supabase keys are missing.");
}

const opts = { auth: { persistSession: false, autoRefreshToken: false } };
const run = ready ? describe : describe.skip;
const tag = Math.random().toString(16).slice(2, 8);
const emailA = `a-${tag}@example.test`;
const emailB = `b-${tag}@example.test`;
const emailOutsider = `outsider-${tag}@example.test`;
const PASSWORD = `Pw-${tag}-${tag}!`;

const jobRow = (email: string, extra: Record<string, unknown> = {}) => ({
  issue: "musty_smell", size_band: "under_2000", preferred_date: "2030-01-15", preferred_time: "10:00",
  name: "Test Client", phone: "+15555550100", email, address: "1 Test Way", city: "Stuart", zip: "34994",
  text_consent: true, area: "core", source: "client", ...extra,
});

run("database walls", () => {
  let admin: SupabaseClient;
  let anon: SupabaseClient;
  let outsider: SupabaseClient; // signed in, but not an admin and not a client
  let jobA = ""; let jobB = ""; let clientA = ""; let clientB = "";
  const outsiderUserIds: string[] = [];
  const pathB = () => `${jobB}/11111111-1111-1111-1111-111111111111.pdf`;

  beforeAll(async () => {
    admin = createClient(url!, serviceKey!, opts);
    anon = createClient(url!, anonKey!, opts);

    const a = await admin.from("requests").insert(jobRow(emailA)).select("id, client_id").single();
    const b = await admin.from("requests").insert(jobRow(emailB, { report_path: "placeholder" })).select("id, client_id").single();
    expect(a.error).toBeNull();
    expect(b.error).toBeNull();
    jobA = a.data!.id; clientA = a.data!.client_id;
    jobB = b.data!.id; clientB = b.data!.client_id;
    await admin.from("requests").update({ report_path: pathB() }).eq("id", jobB);
    await admin.from("client_logins").insert({ client_id: clientB, token_hash: `hash-${tag}`, expires_at: new Date(Date.now() + 900_000).toISOString() });
    await admin.from("client_sessions").insert({ client_id: clientB, token_hash: `sess-${tag}`, expires_at: new Date(Date.now() + 900_000).toISOString() });
    await admin.storage.from("job-reports").upload(pathB(), new Blob(["%PDF-1.4 test"], { type: "application/pdf" }), { upsert: true });

    const made = await admin.auth.admin.createUser({ email: emailOutsider, password: PASSWORD, email_confirm: true });
    expect(made.error).toBeNull();
    outsiderUserIds.push(made.data.user!.id);
    outsider = createClient(url!, anonKey!, opts);
    const signed = await outsider.auth.signInWithPassword({ email: emailOutsider, password: PASSWORD });
    expect(signed.error).toBeNull();
  });

  afterAll(async () => {
    if (!ready) return;
    await admin.storage.from("job-reports").remove([pathB()]);
    await admin.from("requests").delete().in("id", [jobA, jobB].filter(Boolean));
    await admin.from("clients").delete().in("id", [clientA, clientB].filter(Boolean));
    for (const id of outsiderUserIds) await admin.auth.admin.deleteUser(id);
  });

  it("gives each email its own account, whatever the capital letters", async () => {
    expect(clientA).toBeTruthy();
    expect(clientB).toBeTruthy();
    expect(clientA).not.toBe(clientB);
    const again = await admin.from("requests").insert(jobRow(emailA.toUpperCase())).select("id, client_id").single();
    expect(again.data?.client_id).toBe(clientA);
    await admin.from("requests").delete().eq("id", again.data!.id);
  });

  for (const who of ["a stranger with no sign-in", "a signed-in user who is not an admin"] as const) {
    describe(who, () => {
      const db = () => (who.startsWith("a stranger") ? anon : outsider);

      for (const table of ["requests", "clients", "client_logins", "client_sessions"]) {
        it(`reads nothing from ${table}`, async () => {
          const res = await db().from(table).select("*");
          expect(res.data ?? []).toHaveLength(0); // an error or an empty list both mean the wall held
        });
      }

      it("cannot change or delete a job", async () => {
        await db().from("requests").update({ name: "Hacked" }).eq("id", jobB);
        await db().from("requests").delete().eq("id", jobB);
        const row = await admin.from("requests").select("name").eq("id", jobB).single();
        expect(row.data?.name).toBe("Test Client");
      });

      it("cannot create a job directly", async () => {
        const res = await db().from("requests").insert(jobRow(`direct-${tag}@example.test`));
        expect(res.error).not.toBeNull();
      });

      it("cannot download or list another client's report", async () => {
        const dl = await db().storage.from("job-reports").download(pathB());
        expect(dl.data).toBeNull();
        const list = await db().storage.from("job-reports").list(jobB);
        expect(list.data ?? []).toHaveLength(0);
      });

      it("cannot mint a signed link to a report", async () => {
        const res = await db().storage.from("job-reports").createSignedUrl(pathB(), 60);
        expect(res.data?.signedUrl ?? null).toBeNull();
      });
    });
  }
});
