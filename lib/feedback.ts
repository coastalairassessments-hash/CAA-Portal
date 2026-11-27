// Private feedback comes first. A happy client is then pointed to the Google review; an unhappy one
// tells us directly, so we can make it right before it becomes a public review.
import { bookingUrl } from "./links";

export const feedbackUrl = (row: { public_token?: string | null }, siteUrl: string) => {
  const u = bookingUrl(row, siteUrl);
  return u ? `${u}/feedback` : null;
};

export const validRating = (v: unknown): v is 1 | 2 | 3 | 4 | 5 => {
  const n = Number(v);
  return Number.isInteger(n) && n >= 1 && n <= 5;
};

// 4 and 5 go on to the Google review. 1 to 3 stay private.
export const sendsToGoogle = (rating: number): boolean => rating >= 4;

export const RATING_LABELS: Record<number, string> = { 1: "Poor", 2: "Fair", 3: "Okay", 4: "Good", 5: "Great" };
