"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { formatDateLabel } from "@/lib/dates";
import { HOW_HEARD } from "@/lib/request";

const ISSUES = [
  { value: "musty_smell", label: "Musty smell", hint: "Odor or suspected mold" },
  { value: "water_damage", label: "Water damage", hint: "A leak, flood or storm intrusion" },
  { value: "post_remediation", label: "Post-remediation verification (PRV)", hint: "Confirm a mold cleanup worked" },
  { value: "air_quality", label: "Air quality concern", hint: "Allergies, odors or general testing" },
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
  "What are you dealing with?",
  "About how big is the property?",
  "Which day works best?",
  "What start time do you prefer?",
  "Where should we contact you?",
];

type FieldErrors = Record<string, string>;

export default function RequestFlow({ dates }: { dates: string[] }) {
  const router = useRouter();
  const headingRef = useRef<HTMLHeadingElement>(null);

  const [step, setStep] = useState(0);
  const [issue, setIssue] = useState("");
  const [sizeBand, setSizeBand] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredTime, setPreferredTime] = useState("");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
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
        router.push("/request/done");
        return;
      }
      if (res.status === 400 && data.errors) {
        const fieldErrors = data.errors as FieldErrors;
        setErrors(fieldErrors);
        // A problem in an earlier step sends the person back to fix it.
        if (fieldErrors.issue) setStep(0);
        else if (fieldErrors.sizeBand) setStep(1);
        else if (fieldErrors.preferredDate) setStep(2);
        else if (fieldErrors.preferredTime) setStep(3);
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

  const issueLabel = ISSUES.find((i) => i.value === issue)?.label;
  const sizeLabel = SIZES.find((s) => s.value === sizeBand)?.label;
  const timeLabel = TIMES.find((t) => t.value === preferredTime)?.label;

  return (
    <div className="flow">
      <div
        className="progress"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={5}
        aria-valuenow={step + 1}
        aria-label="Request progress"
      >
        <span style={{ width: `${((step + 1) / 5) * 100}%` }} />
      </div>
      <p className="step-count">Step {step + 1} of 5</p>

      <h1 ref={headingRef} tabIndex={-1}>
        {STEP_TITLES[step]}
      </h1>

      {step === 0 && (
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

      {step === 1 && (
        <>
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
                onClick={() => pick(setSizeBand, o.value)}
              >
                <span className="label">{o.label}</span>
                <span className="hint">{o.hint}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <p className="help">We schedule Monday through Thursday. We confirm the final day with you.</p>
          <div className="choices grid-2">
            {dates.map((d) => (
              <button
                key={d}
                type="button"
                className="choice"
                aria-pressed={preferredDate === d}
                onClick={() => pick(setPreferredDate, d)}
              >
                <span className="label">{formatDateLabel(d)}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {step === 3 && (
        <div className="choices grid-2">
          {TIMES.map((o) => (
            <button
              key={o.value}
              type="button"
              className="choice"
              aria-pressed={preferredTime === o.value}
              onClick={() => pick(setPreferredTime, o.value)}
            >
              <span className="label">{o.label}</span>
            </button>
          ))}
        </div>
      )}

      {step === 4 && (
        <form onSubmit={submit} noValidate>
          <p className="summary">
            {issueLabel}, {sizeLabel}, {preferredDate && formatDateLabel(preferredDate)} at {timeLabel}
          </p>

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

            <div className="field">
              <label htmlFor="address">Property address</label>
              <input
                id="address"
                type="text"
                autoComplete="street-address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                aria-invalid={!!errors.address}
                aria-describedby={errors.address ? "address-err" : undefined}
              />
              {errors.address && <p className="error" id="address-err">{errors.address}</p>}
            </div>

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
              {busy ? "Sending..." : "Send request"}
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
