# CAA Portal: where we stand (2026-11-27)

Live: https://book.coastalairassessments.com (admin at /admin). Main site repo: coastal-air-assessments-site (its booking buttons point here).
Code: github.com/coastalairassessments-hash/CAA-Portal, `main` is what Netlify deploys. Every change goes through a pull request.

## Live and working
- Booking: Mon-Thu, two start times (10:00, 12:30). Inside Martin, St. Lucie and Palm Beach a client picks a time and pays the deposit (Stripe Checkout) and is scheduled with no waiting. Outside those counties Cory reviews first. A date is held only once the deposit is paid.
- Pricing: first hour $685 (Consultation $375, PRV $575), then $195/hr in 15-minute steps, samples $85, deposit 75%. A visit over 2 hours blocks the day.
- Cancel and reschedule (policy v3): more than 24 hours ahead is a full refund or a free reschedule. Inside 24 hours the client chooses one free late reschedule, or cancels and pays a $250 fee (the rest of the deposit is refunded: $263.75 on $513.75). The client ticks a box to confirm, and what they were shown is stored for disputes. Inspector cancels are a full refund. Bookings accepted under the older policy (v2) keep the older rule.
- Refunds are made by hand in Stripe, then "Mark refunded" on the job. Nothing refunds automatically.
- Admin: Home (today's visits, a three-week schedule, a "Later" list for visits booked further out, money, pipeline, refunds due, referrals to thank), Week, Clients, Add, Contractors, Links, Payments, Referrals, Texts, More. The job page has the cancel and refund panels, the visit summary, and the client's rating.
- After a visit: a same-day "what we found" note (tap-to-text or email), a 1-5 rating (4-5 goes to the Google review, 1-3 stays private), one deposit reminder for unpaid offers, an "on the way" text with an ETA, a save-our-contact card, and a referral thank-you.
- Final payments and report: the final invoice, the report upload that releases the final-payment request, and the report access link for the client.
- Contractor portal: passwordless sign-in, contractors book PRV visits, billed per job.
- Hardening (2026-11-27): spam limit holds under a burst, request size is capped by bytes received, security headers on every page, private link pages kept out of search, address lookup throttled, scheduled jobs use one timing-safe key check.
- Scheduled jobs run on Netlify: the briefing (hourly) and the payments sweep (every 5 minutes) call the portal with the shared key.

## Database
Migrations are applied in Supabase through 0032 (run 2026-11-27). Migration files are in `supabase/migrations/`; add new ones in order and run them in the Supabase SQL editor before merging code that needs them.

## Tests
`npm test` (unit), `npx tsc --noEmit`, `npx eslint .`. All three pass on `main` as of today. Browser testing used a local stand-in database; the admin screens have been checked only against that, not logged in on the live site.

## Cory's list
1. Michael Calvitti paid two $513.75 deposits (Nov 19 and Nov 26) and moved from Nov 30 to Dec 21. Refund the Nov 19 payment in Stripe, then press Mark refunded on his cancelled Nov 30 job.
2. In Google Cloud, limit the address-lookup key to the Places API and set a daily cap.
3. Log in to the admin and look over Home, the Later list, and one job (cancel panel, refund panel).

## Not built / waiting
- Automatic Stripe refunds (wait until a few have been done by hand, then build the button around how they go).
- Automatic texts: waiting on carrier registration. Texts are tap-to-send from Cory's phone for now.
- Other payment types recorded in the portal (Zelle, check, cash, bank transfer) and the contractor agreement terms (net 15, $250 after 30 days, trip fees) are planned, not confirmed built.
- Unconfirmed from earlier notes, check before relying on them: Resend sending domain (mail.coastalairassessments.com) and CLIENT_FROM / ALERT_FROM settings; Supabase Pro backups; two-factor on logins; attorney review of policy, privacy and EULA.
