// The Booking and Payment Policy, exactly as clients agree to it. This is separate from the
// insurance Terms. A wording change means a new version: bump POLICY_VERSION and update the
// fingerprint in policy.test.ts. Old agreements stay tied to the version the client saw.
export const POLICY_VERSION = "v3-2026-11";
export const POLICY_TITLE = "Booking and Payment Policy";

export const POLICY_INTRO =
  "This policy explains how booking, payment and cancellation work with Coastal Air Assessments.";

export const POLICY_SECTIONS: { n: number; title: string; text: string }[] = [
  {
    n: 1,
    title: "One-hour minimum",
    text: "Every visit is billed for a minimum of one hour on site.",
  },
  {
    n: 2,
    title: "Time on site",
    text: "Time after the first hour is $195 an hour, rounded up to the next 15 minutes. You may limit our time on site. The assessment then covers only the areas we complete, and the findings reflect only those areas.",
  },
  {
    n: 3,
    title: "Deposit",
    text: "A deposit of 75% of the first-hour price holds your date. The date is held when we receive the deposit. If two people ask for the same time, the first deposit holds it.",
  },
  {
    n: 4,
    title: "Balance and report",
    text: "The balance is due on the final invoice after the visit. It includes any extra time, lab samples ($85 each) and other agreed charges, less your deposit. Your written report is released once the final invoice is paid.",
  },
  {
    n: 5,
    title: "Cancel or reschedule",
    text: "Cancel more than 24 hours before your visit for a full refund of your deposit, and reschedule for free. Within 24 hours of your visit you can reschedule once, free, and your deposit carries over. Or you can cancel and a $250 cancellation fee applies: we keep $250 of your deposit and refund the rest. If we cancel, you get a full refund.",
  },
  {
    n: 6,
    title: "Post-remediation verification (PRV)",
    text: "A PRV is charged in full whatever the result. If the area does not meet industry guidelines, that is a fail, and the visit is still billed and is not refunded. The fee covers our time and the assessment, not a passing result.",
  },
];

// One plain sentence shown wherever a homeowner chooses a PRV.
export const PRV_NOTICE =
  "A PRV is charged in full whatever the result. If the area does not meet industry guidelines, the visit is still billed and is not refunded.";

// The cancel rule of the version a booking was accepted under, kept word for word so a dispute can be answered.
export const POLICY_V2_CANCEL_TEXT =
  "Cancel more than 24 hours before your visit for a full refund of your deposit. Within 24 hours of your visit, the deposit is not refunded. Rescheduling more than 24 hours ahead is free. Within 24 hours it counts as a cancellation.";

// The one short statement of the rule, shown at scheduling, at the deposit, on the booking page and in emails.
export const CANCEL_RULE_SHORT =
  "Cancel or reschedule more than 24 hours ahead and your deposit is refunded in full. Within 24 hours, you can reschedule once for free, or cancel with a $250 cancellation fee and the rest of your deposit refunded.";
