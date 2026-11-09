// Runs at 7 AM and 7 PM Eastern. Tests the whole booking path and alerts Cory only if something is wrong.
export default async () => {
  const base = process.env.URL || "https://caaportal.netlify.app";
  const res = await fetch(`${base}/api/selfcheck`, { headers: { "x-cron-key": (process.env.IP_HASH_SALT || "").trim().replace(/^["']+|["']+$/g, "") } });
  console.log("selfcheck", res.status, await res.text());
};
export const config = { schedule: "0 12,0 * * *" };
