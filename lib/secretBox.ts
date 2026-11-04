// SERVER ONLY. Locks a secret (the QuickBooks tokens) before it goes into the database, so a leaked backup
// or a stolen database copy does not hand over access to the books. AES-256-GCM: tampering is detected.
// The key is QB_TOKEN_KEY, 32 random bytes as base64 (make one with: openssl rand -base64 32). It lives only in Netlify.
//
// Safe to roll out: with no key set, values are stored as before. Values saved before the key existed still read
// fine, and they get locked the next time QuickBooks refreshes them.
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const PREFIX = "enc1:";

function keyFrom(raw: string | undefined): Buffer | null {
  const v = raw?.trim().replace(/^["']+|["']+$/g, "").trim();
  if (!v) return null;
  const key = Buffer.from(v, "base64");
  if (key.length !== 32) throw new Error("QB_TOKEN_KEY must be 32 bytes as base64");
  return key;
}

export const sealingOn = (env: Record<string, string | undefined> = process.env) => keyFrom(env.QB_TOKEN_KEY) !== null;

export function seal(plain: string, env: Record<string, string | undefined> = process.env): string {
  const key = keyFrom(env.QB_TOKEN_KEY);
  if (!key) return plain;
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", key, iv);
  const body = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  return PREFIX + Buffer.concat([iv, c.getAuthTag(), body]).toString("base64");
}

export function open(value: string, env: Record<string, string | undefined> = process.env): string {
  if (!value.startsWith(PREFIX)) return value; // saved before locking was on
  const key = keyFrom(env.QB_TOKEN_KEY);
  if (!key) throw new Error("Stored QuickBooks tokens are locked but QB_TOKEN_KEY is not set");
  const raw = Buffer.from(value.slice(PREFIX.length), "base64");
  const d = createDecipheriv("aes-256-gcm", key, raw.subarray(0, 12));
  d.setAuthTag(raw.subarray(12, 28));
  return Buffer.concat([d.update(raw.subarray(28)), d.final()]).toString("utf8");
}
