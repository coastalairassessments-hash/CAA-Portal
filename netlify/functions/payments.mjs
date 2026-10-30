// Runs every 5 minutes. Books clients who paid their deposit and frees the time of those who did not.
export default async () => {
  const base = process.env.URL || "https://caaportal.netlify.app";
  const res = await fetch(`${base}/api/payments`, { headers: { "x-cron-key": (process.env.IP_HASH_SALT || "").trim().replace(/^["']+|["']+$/g, "") } });
  console.log("payments", res.status);
};
export const config = { schedule: "*/5 * * * *" };
