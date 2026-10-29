# CAA Portal: where we left off (2026-10-29)

Live: https://caaportal.netlify.app (admin at /admin). Main site repo: coastal-air-assessments-site (booking buttons point to the portal).

## Done and live
- Client request flow with a Mon-Thu calendar, two buttons a day (10:00, 12:30). 2,000 sq ft and up: 10:00 only.
- Admin: Today, Requests, Add contractor job, More, Quick texts, job page, light mockup styling.
- Pricing: Consultation $375, Mold/IAQ $685, PRV $575, extra time $195/hr in 15-min steps, samples $85, deposit 75%.
- Day rules: a visit over 2 hours blocks the whole day (DB enforced, migration 0011). 2 hours leaves 12:30 or 1:00 open. Latest start 1:00 PM.
- Cancel more than 24 hours ahead: deposit refunded. Reschedule more than 24 hours ahead: free.
- QuickBooks (Intuit SANDBOX): connected from More. Client search (More > Find a client). Client created in QuickBooks when a request is approved. "Send final invoice" button on the job's Money drawer (migration 0010).
- Main site: 128 booking buttons repointed, cancellation page aligned, $350 screening removed.
- Google review link and phone 561-400-0929 are in.

## Supabase migrations all run through 0011.

## Next
1. Resend: add domain mail.coastalairassessments.com (Domains > Add), screenshot the DNS table, add records (Netlify DNS or registrar), then set CLIENT_FROM and ALERT_FROM in Netlify. Until then client emails reach only the account owner.
2. Intuit production keys: finish the app questionnaire (privacy /privacy, EULA /eula, host caaportal.netlify.app, redirect https://caaportal.netlify.app/api/qb/callback), then set QB_ENV=production with the production Client ID/Secret and reconnect on More.
3. Optional: grey out held slots on the client calendar (asked, not yet answered).
4. Subdomain book.coastalairassessments.com, then swap the buttons on the main site and set SITE_URL.
5. Before real clients: Supabase Pro backups, two-factor on logins, clear test data, Jonathan security review, attorney glance at policy/privacy/EULA.
6. Later: deposit via QuickBooks pay link, mark paid from QuickBooks, day-before reminders, carrier registration for automatic texts.
