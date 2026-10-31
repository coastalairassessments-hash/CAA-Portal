"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { formatDateLabel } from "@/lib/dates";
import SlotCalendar from "./SlotCalendar";
import AddressField from "./AddressField";
import type { Slot } from "@/lib/slots";
import { HOW_HEARD, isLongVisit } from "@/lib/request";
import { CLIENT_TYPES, PROPERTY_TYPES, WATER_WHEN, YES_NO, asksCompany, isMultiUnit, isOrg, needsQuote } from "@/lib/intake";
import { depositCents, firstHourCents, formatMoney } from "@/lib/pricing";

const ISSUES = [
  { value: "musty_smell", label: "Musty smell", hint: "Odor or suspected mold" },
  { value: "water_damage", label: "Water damage", hint: "A leak, flood or storm intrusion" },
  { value: "post_remediation", label: "Post-remediation verification (PRV)", hint: "Confirm a mold cleanup worked" },
  { value: "air_quality", label: "Air quality concern", hint: "Allergies, odors or general testing" },
  { value: "consultation", label: "Consultation", hint: "One hour on site, no written report" },
  { value: "other", label: "Something else", hint: "You can explain in the notes" },
];

const SIZES = [
  { value: "under_2000", label: "Under 2,000 sq ft", hint: "Typically about 1 hour" },
  { value: "2000_4000", label: "2,000 to 4,000 sq ft", hint: "Typically about 2 to 3 hours" },
  { value: "4000_6000", label: "4,000 to 6,000 sq ft", hint: "Typically about 3 to 4 hours" },
  { value: "over_6000", label: "Over 6,000 sq ft", hint: "We confirm the time with you" },
];

const TIMES = [
  { value: "10:00", label: "10:00 AM" },
  { value: "12:30", label: "12:30 PM" },
];

const STEP_TITLES = [
  "Who are you?",
  "What are you dealing with?",
  "Tell us about the property",
  "Pick a day and start time",
  "Where should we contact you?",
];
const TOTAL = STEP_TITLES.length;
const TIME_LEFT = ["about 2 minutes left", "about 2 minutes left", "about a minute and a half left", "about a minute left", "last step"];
const DRAFT_KEY = "caa-request-draft-v1";

// Everything a returning client does not have to retype. The property address is never carried over.
export type Prefill = { clientType: string; name: string; phone: string; email: string; company: string; role: string; billTo: string; canApprove: string };

type FieldErrors = Record<string, string>;

export default function RequestFlow({ dates, held, again }: { dates: string[]; held: Slot[]; again?: Prefill }) {
  const router = useRouter();
  const headingRef = useRef<HTMLHeadingElement>(null);

  const [step, setStep] = useState(again ? 1 : 0);
  const [clientType, setClientType] = useState(again?.clientType ?? "");
  const [propertyType, setPropertyType] = useState("");
  const [company, setCompany] = useState(again?.company ?? "");
  const [role, setRole] = useState(again?.role ?? "");
  const [canApprove, setCanApprove] = useState(again?.canApprove ?? "");
  const [billTo, setBillTo] = useState(again?.billTo ?? "");
  const [units, setUnits] = useState("");
  const [waterWhen, setWaterWhen] = useState("");
  const [leakFixed, setLeakFixed] = useState("");
  const [insuranceClaim, setInsuranceClaim] = useState("");
  const [closingDate, setClosingDate] = useState("");
  const [issue, setIssue] = useState("");
  const [sizeBand, setSizeBand] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredTime, setPreferredTime] = useState("");

  const [name, setName] = useState(again?.name ?? "");
  const [phone, setPhone] = useState(again?.phone ?? "");
  const [email, setEmail] = useState(again?.email ?? "");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [zip, setZip] = useState("");
  const [notes, setNotes] = useState("");
  const [howHeard, setHowHeard] = useState("");
  const [textConsent, setTextConsent] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [website, setWebsite] = useState(""); // hidden bot trap

  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");

  // Keep a draft on this phone so leaving to take a call does not lose the answers.
  const [restored, setRestored] = useState(false);
  /* Reading the saved draft has to happen after the page loads, so state is set from an effect on purpose. */
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!again) {
      try {
        const d = JSON.parse(localStorage.getItem(DRAFT_KEY) ?? "null");
        if (d && typeof d === "object" && Date.now() - (d.at ?? 0) < 1000 * 60 * 60 * 24 * 3) {
          const str = (v: unknown) => (typeof v === "string" ? v : "");
          setClientType(str(d.clientType)); setPropertyType(str(d.propertyType)); setCompany(str(d.company)); setRole(str(d.role));
          setCanApprove(str(d.canApprove)); setBillTo(str(d.billTo)); setUnits(str(d.units)); setIssue(str(d.issue)); setSizeBand(str(d.sizeBand));
          setName(str(d.name)); setPhone(str(d.phone)); setEmail(str(d.email)); setAddress(str(d.address)); setCity(str(d.city)); setZip(str(d.zip)); setNotes(str(d.notes));
          const day = str(d.preferredDate);
          if (day && dates.includes(day)) { setPreferredDate(day); setPreferredTime(str(d.preferredTime)); }
          const st = Number(d.step);
          if (st >= 1 && st <= 4) setStep(st === 4 && !(day && dates.includes(day)) ? 3 : st);
        }
      } catch { /* no draft */ }
    }
    setRestored(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!restored) return;
    const t = setTimeout(() => {
      try {
        const empty = !clientType && !name && !address;
        if (empty) return;
        localStorage.setItem(DRAFT_KEY, JSON.stringify({ at: Date.now(), step, clientType, propertyType, company, role, canApprove, billTo, units, issue, sizeBand, preferredDate, preferredTime, name, phone, email, address, city, zip, notes }));
      } catch { /* storage can be off */ }
    }, 400);
    return () => clearTimeout(t);
  }, [restored, step, clientType, propertyType, company, role, canApprove, billTo, units, issue, sizeBand, preferredDate, preferredTime, name, phone, email, address, city, zip, notes]);

  // Move focus to the new step's heading so screen readers follow along.
  useEffect(() => {
    headingRef.current?.focus();
  }, [step]);

  function pick(setter: (v: string) => void, value: string) {
    setter(value);
    setStep((s) => s + 1);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    setFormError("");
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientType,
          propertyType,
          company: asksCompany(clientType) ? company : "",
          // Only the answers for questions this person was actually shown.
          details: {
            role: asksCompany(clientType) ? role : "",
            canApprove: isOrg(clientType) ? canApprove : "",
            billTo: isOrg(clientType) ? billTo : "",
            units: isMultiUnit(propertyType) ? units : "",
            waterWhen: issue === "water_damage" ? waterWhen : "",
            leakFixed: issue === "water_damage" ? leakFixed : "",
            insuranceClaim: issue === "water_damage" ? insuranceClaim : "",
            closingDate: clientType === "real_estate" ? closingDate : "",
          },
          issue,
          sizeBand,
          preferredDate,
          preferredTime,
          name,
          phone,
          email,
          address,
          city,
          zip,
          notes,
          howHeard: howHeard || undefined,
          textConsent,
          termsAccepted,
          website,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        try { localStorage.removeItem(DRAFT_KEY); } catch { /* fine */ }
        // Booked and waiting on the deposit: go straight to the payment page.
        router.push(data.instant && data.token ? `/booking/${data.token}` : "/request/done");
        return;
      }
      if (res.status === 409) {
        // Someone took that time a moment ago. Back to the calendar to pick another.
        setErrors(data.errors ?? {});
        setPreferredDate("");
        setPreferredTime("");
        setStep(3);
        setFormError(data.errors?.preferredDate ?? "That time was just taken. Please pick another.");
        return;
      }
      if (res.status === 400 && data.errors) {
        const fieldErrors = data.errors as FieldErrors;
        setErrors(fieldErrors);
        // A problem in an earlier step sends the person back to fix it.
        if (fieldErrors.clientType) setStep(0);
        else if (fieldErrors.issue) setStep(1);
        else if (fieldErrors.sizeBand || fieldErrors.propertyType) setStep(2);
        else if (fieldErrors.preferredDate || fieldErrors.preferredTime) setStep(3);
        else setFormError("Please check the highlighted fields.");
      } else {
        setFormError(
          data.error ?? "Something went wrong. Please try again, or give us a call.",
        );
      }
    } catch {
      setFormError("We could not reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  // Everyone except bigger buildings books and pays the deposit right away.
  const instantFlow = !needsQuote(propertyType) && sizeBand !== "over_6000";
  const issueLabel = ISSUES.find((i) => i.value === issue)?.label;
  const sizeLabel = SIZES.find((s) => s.value === sizeBand)?.label;
  const timeLabel = TIMES.find((t) => t.value === preferredTime)?.label;

  return (
    <div className="flow">
      <div
        className="progress"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={TOTAL}
        aria-valuenow={step + 1}
        aria-label="Request progress"
      >
        <span style={{ width: `${((step + 1) / TOTAL) * 100}%` }} />
      </div>
      <p className="step-count">Step {step + 1} of {TOTAL} · {TIME_LEFT[step]}</p>

      <h1 ref={headingRef} tabIndex={-1}>
        {STEP_TITLES[step]}
      </h1>

      {step === 0 && (
        <div className="choices">
          {CLIENT_TYPES.map((o) => (
            <button
              key={o.value}
              type="button"
              className="choice"
              aria-pressed={clientType === o.value}
              onClick={() => pick(setClientType, o.value)}
            >
              <span className="label">{o.label}</span>
              <span className="hint">{o.hint}</span>
            </button>
          ))}
        </div>
      )}

      {step === 1 && (
        <div className="choices">
          {ISSUES.map((o) => (
            <button
              key={o.value}
              type="button"
              className="choice"
              aria-pressed={issue === o.value}
              onClick={() => pick(setIssue, o.value)}
            >
              <span className="label">{o.label}</span>
              <span className="hint">{o.hint}</span>
            </button>
          ))}
        </div>
      )}

      {step === 2 && (
        <>
          <h2 className="sub-q">What kind of property?</h2>
          <div className="choices compact">
            {PROPERTY_TYPES.map((o) => (
              <button
                key={o.value}
                type="button"
                className="choice"
                aria-pressed={propertyType === o.value}
                onClick={() => setPropertyType(o.value)}
              >
                <span className="label">{o.label}</span>
              </button>
            ))}
          </div>
          {errors.propertyType && <p className="error">{errors.propertyType}</p>}
          <h2 className="sub-q">About how big is it?</h2>
          <p className="help">
            These are typical visit times. We confirm the actual time for your property.
          </p>
          <div className="choices">
            {SIZES.map((o) => (
              <button
                key={o.value}
                type="button"
                className="choice"
                aria-pressed={sizeBand === o.value}
                onClick={() => { setPreferredDate(""); setPreferredTime(""); setSizeBand(o.value); }}
              >
                <span className="label">{o.label}</span>
                <span className="hint">{o.hint}</span>
              </button>
            ))}
          </div>
          <button type="button" className="btn" disabled={!propertyType || !sizeBand} onClick={() => setStep(3)}>
            Continue
          </button>
        </>
      )}

      {step === 3 && (
        <SlotCalendar
          dates={dates}
          date={preferredDate}
          time={preferredTime}
          longVisit={isLongVisit(sizeBand)}
          held={held}
          onPick={(d, t) => {
            setPreferredDate(d);
            setPreferredTime(t);
          }}
        />
      )}

      {step === 3 && (
        <div className="book-foot">
          <div className="note">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 018 0v3" /></svg>
            <div>
              <strong>Your deposit holds the time</strong>
              {issue && (
                <p className="price-line">
                  {needsQuote(propertyType)
                    ? `${issueLabel}: we confirm the price for this kind of property. The deposit is 75% of the first hour.`
                    : `${issueLabel} from ${formatMoney(firstHourCents(issue))} for the first hour. Deposit to hold your time: ${formatMoney(depositCents(issue))}.`}
                </p>
              )}
              <p>
                {instantFlow
                  ? "You pay the deposit on the next screen, and your time is held while you do. Cancel more than 24 hours ahead for a full refund."
                  : "Nothing to pay today. We confirm the price and send a secure link. Cancel more than 24 hours ahead for a full refund."}
              </p>
            </div>
          </div>
          <button type="button" className="btn" disabled={!preferredDate || !preferredTime} onClick={() => setStep(4)}>
            Continue
          </button>
        </div>
      )}

      {step === 4 && (
        <form onSubmit={submit} noValidate>
          <p className="summary">
            {issueLabel}, {sizeLabel}, {preferredDate && formatDateLabel(preferredDate)} at {timeLabel}
          </p>
          {instantFlow ? (
            <ol className="how">
              <li><strong>Add your details</strong> below.</li>
              <li><strong>Pay the deposit.</strong> 75% of the first hour, by card or bank. Your time is held while you pay.</li>
              <li><strong>You are booked.</strong> We email your confirmation and calendar invite right away.</li>
            </ol>
          ) : (
            <ol className="how">
              <li><strong>You request</strong> this time. Nothing to pay today.</li>
              <li><strong>We confirm</strong> the price and send a secure deposit link.</li>
              <li><strong>Your deposit locks it.</strong> 75% of the first hour.</li>
            </ol>
          )}

          <div className="fields">
            <div className="field">
              <label htmlFor="name">Full name</label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? "name-err" : undefined}
              />
              {errors.name && <p className="error" id="name-err">{errors.name}</p>}
            </div>

            <div className="field">
              <label htmlFor="phone">Mobile phone</label>
              <input
                id="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                aria-invalid={!!errors.phone}
                aria-describedby={errors.phone ? "phone-err" : undefined}
              />
              {errors.phone && <p className="error" id="phone-err">{errors.phone}</p>}
            </div>

            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-err" : undefined}
              />
              {errors.email && <p className="error" id="email-err">{errors.email}</p>}
            </div>

            <AddressField
              value={address}
              onChange={setAddress}
              onPick={(p) => { setAddress(p.address); if (p.city) setCity(p.city); if (p.zip) setZip(p.zip); }}
              error={errors.address}
            />

            <div className="field-row">
              <div className="field">
                <label htmlFor="city">City</label>
                <input
                  id="city"
                  type="text"
                  autoComplete="address-level2"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  aria-invalid={!!errors.city}
                  aria-describedby={errors.city ? "city-err" : undefined}
                />
                {errors.city && <p className="error" id="city-err">{errors.city}</p>}
              </div>
              <div className="field">
                <label htmlFor="zip">ZIP</label>
                <input
                  id="zip"
                  type="text"
                  inputMode="numeric"
                  autoComplete="postal-code"
                  value={zip}
                  onChange={(e) => setZip(e.target.value)}
                  aria-invalid={!!errors.zip}
                  aria-describedby={errors.zip ? "zip-err" : undefined}
                />
                {errors.zip && <p className="error" id="zip-err">{errors.zip}</p>}
              </div>
            </div>

            {(asksCompany(clientType) || isMultiUnit(propertyType) || issue === "water_damage" || clientType === "real_estate") && (
              <p className="help detail-head">A few details so we arrive prepared</p>
            )}

            {asksCompany(clientType) && (
              <>
                <div className="field">
                  <label htmlFor="company">
                    {clientType === "manager" ? "Company or association" : "Company"}
                    {!isOrg(clientType) && <span className="optional"> (optional)</span>}
                  </label>
                  <input id="company" type="text" autoComplete="organization" value={company} onChange={(e) => setCompany(e.target.value)} aria-invalid={!!errors.company} />
                  {errors.company && <p className="error">{errors.company}</p>}
                </div>
                <div className="field">
                  <label htmlFor="role">Your role <span className="optional">(optional)</span></label>
                  <input id="role" type="text" autoComplete="organization-title" value={role} onChange={(e) => setRole(e.target.value)} />
                </div>
              </>
            )}

            {isOrg(clientType) && (
              <>
                <div className="field">
                  <label htmlFor="canApprove">Can you approve the work and pay for it?</label>
                  <select id="canApprove" value={canApprove} onChange={(e) => setCanApprove(e.target.value)}>
                    <option value="">Choose one</option>
                    {YES_NO.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="billTo">Who should get the invoice? <span className="optional">(optional)</span></label>
                  <input id="billTo" type="text" placeholder="Name or email" value={billTo} onChange={(e) => setBillTo(e.target.value)} />
                </div>
              </>
            )}

            {isMultiUnit(propertyType) && (
              <div className="field">
                <label htmlFor="units">How many units or areas are affected? <span className="optional">(optional)</span></label>
                <input id="units" type="text" value={units} onChange={(e) => setUnits(e.target.value)} />
              </div>
            )}

            {issue === "water_damage" && (
              <>
                <div className="field">
                  <label htmlFor="waterWhen">When did the water event happen?</label>
                  <select id="waterWhen" value={waterWhen} onChange={(e) => setWaterWhen(e.target.value)}>
                    <option value="">Choose one</option>
                    {WATER_WHEN.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="leakFixed">Has the source been fixed?</label>
                  <select id="leakFixed" value={leakFixed} onChange={(e) => setLeakFixed(e.target.value)}>
                    <option value="">Choose one</option>
                    {YES_NO.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="insuranceClaim">Is this part of an insurance claim?</label>
                  <select id="insuranceClaim" value={insuranceClaim} onChange={(e) => setInsuranceClaim(e.target.value)}>
                    <option value="">Choose one</option>
                    {YES_NO.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </>
            )}

            {clientType === "real_estate" && (
              <div className="field">
                <label htmlFor="closingDate">Closing date <span className="optional">(optional)</span></label>
                <input id="closingDate" type="date" value={closingDate} onChange={(e) => setClosingDate(e.target.value)} aria-invalid={!!errors.details} />
                {errors.details && <p className="error">{errors.details}</p>}
              </div>
            )}

            <div className="field">
              <label htmlFor="notes">
                Anything we should know? <span className="optional">(optional)</span>
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={1000}
              />
            </div>

            <div className="field">
              <label htmlFor="howHeard">
                How did you hear about us? <span className="optional">(optional)</span>
              </label>
              <select id="howHeard" value={howHeard} onChange={(e) => setHowHeard(e.target.value)}>
                <option value="">Choose one</option>
                {HOW_HEARD.map((h) => (
                  <option key={h.value} value={h.value}>{h.label}</option>
                ))}
              </select>
            </div>

            <div className="field consent">
              <input
                id="textConsent"
                type="checkbox"
                checked={textConsent}
                onChange={(e) => setTextConsent(e.target.checked)}
              />
              <label htmlFor="textConsent">
                Text me updates about this request
                <small>Message and data rates may apply. You can reply STOP at any time.</small>
              </label>
            </div>

            <div className="field consent">
              <input
                id="termsAccepted"
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                aria-invalid={!!errors.termsAccepted}
                aria-describedby={errors.termsAccepted ? "terms-err" : undefined}
              />
              <label htmlFor="termsAccepted">
                I have read and agree to the{" "}
                <a href="/terms" target="_blank" rel="noreferrer">
                  Mold Assessment and Sampling Terms
                </a>{" "}
                and the{" "}
                <a href="/policy" target="_blank" rel="noreferrer">
                  Booking and Payment Policy
                </a>
                <small>
                  This is a limited, non-destructive assessment. The terms explain what it covers and
                  what it does not. The policy covers deposits and cancellation.
                </small>
              </label>
              {errors.termsAccepted && (
                <p className="error" id="terms-err">{errors.termsAccepted}</p>
              )}
            </div>

            {/* Hidden bot trap: leave empty */}
            <div className="trap" aria-hidden="true">
              <label htmlFor="website">Website</label>
              <input
                id="website"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </div>
          </div>

          {formError && (
            <p className="form-error" role="alert">
              {formError}
            </p>
          )}

          <div className="nav-row">
            <button type="button" className="btn btn-quiet" onClick={() => setStep(3)}>
              Back
            </button>
            <button type="submit" className="btn" disabled={busy}>
              {busy ? "One moment..." : instantFlow ? "Continue to deposit" : "Send request"}
            </button>
          </div>
        </form>
      )}

      {step > 0 && step < 4 && (
        <div className="nav-row">
          <button type="button" className="btn btn-quiet" onClick={() => setStep(step - 1)}>
            Back
          </button>
        </div>
      )}
    </div>
  );
}
