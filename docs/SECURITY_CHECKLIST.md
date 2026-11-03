# Security checklist (run before each release)

Goal: a release gate we run ourselves. Claude walks every box against the code and tests; Cory signs off. The automatic checks (types, lint, 300+ unit tests, locked-door tests, secret scan, code scan, dependency scan) run on every push, so start from a green build. The files below are the ones that guard money and client data.

## 1. Who can see what (about 3 hours)
**Sign-in and sessions** `lib/clientServer.ts`, `lib/clientAuth.ts`, `lib/contractorServer.ts`, `lib/contractorAuth.ts`, `app/portal/`, `app/contractor/`
- [ ] Link and session tokens are 32 random bytes, stored only as SHA-256 hashes, one-time, 15-minute links, 30-day sessions
- [ ] Session cookie is httpOnly, secure, sameSite lax, scoped to `/portal` or `/contractor`
- [ ] The emailed link opens a page with a button (so an email scanner cannot spend it); the button posts the token
- [ ] "Email me a link" answers the same whether or not the address exists; capped at 5 links per hour per account
- [ ] Sessions and links are deleted on sign-out and cascade when a client is deleted

**Reports** `lib/report.ts`, `app/portal/report/[id]/route.ts`, `app/booking/[token]/report/route.ts`, `app/contractor/report/[id]/route.ts`, `app/admin/reportActions.ts`
- [ ] A report opens only for the job's own signed-in client, only once paid or released, only from that job's folder (`canOpenReport`)
- [ ] Download is a 10-minute signed link; the bucket is private
- [ ] Upload accepts only real PDFs (magic bytes) under the size cap and only from admins
- [ ] The booking link alone never reaches the file

**Database** `supabase/migrations/`
- [ ] Row-level security is on for all 16 tables (checked by script at time of writing; re-check after new migrations)
- [ ] Client, session and login tables allow no browser access at all; only the server key reads them
- [ ] Storage policies for `job-reports` and job photos are admin-only
- [ ] Try the migrations in order on a copy before production

**Server key use** `lib/bookingServer.ts` and every `serviceDb()` call
- [ ] The service key bypasses row-level security, so every query that uses it must be filtered by token, client id, or an admin check. List the call sites and confirm.

## 2. Everything that changes data (about 3 hours)
- [ ] `app/admin/*Actions.ts` and `app/admin/actions.ts`: every exported action checks the user is signed in and on the admin list before writing
- [ ] `app/admin/stampActions.ts`: has its own admin check (confirmed when written)
- [ ] `app/booking/actions.ts`: cancel and reschedule are scoped to the booking token
- [ ] `app/contractor/actions.ts`: scheduling requires a contractor session
- [ ] `app/api/requests/route.ts`: body size cap, bot trap, 3-per-hour limit by hashed IP, input validated by `lib/request.ts`
- [ ] `app/api/address/route.ts`: unauthenticated and costs money per call; confirm the Google key is restricted and capped
- [ ] `app/api/payments/route.ts`, `app/api/briefing/route.ts`: guarded by the `x-cron-key` header

## 3. Known soft spots, your call
- The cron key reuses `IP_HASH_SALT`. Suggest a separate secret and a constant-time comparison.
- Pages stream, so a redirect or "not found" can arrive after a 200 status. Fine for browsers; keep in mind for scanners.
- The address-lookup limiter is in-memory per server instance (best effort). The request form's limit is database-backed.
- The Content-Security-Policy holds only the safe directives. A script allow-list needs a nonce plan and a trial run.
- Tests prove the site fails closed with no database. They do not yet prove client A cannot read client B's rows against a real database. A local-Supabase test tier would close that gap.
- QuickBooks token encryption is on the `security-hardening` branch.

## 4. Settings (about 2 hours)
- [ ] Supabase: Pro plan with point-in-time backups, two-factor on the owner login, signups disabled, security advisor run clean
- [ ] Netlify: two-factor, environment variables set, none starting `NEXT_PUBLIC_` that are secret, production and test separated
- [ ] Google Cloud: Places key restricted to the Places API with a daily cap
- [ ] GitHub: branch protection on `main`, required checks, code-owner review, secret scanning and Dependabot alerts on, repository private
