// Runs every hour. The app decides whether it is 7 AM or 7 PM Eastern and sends the briefing.
export default async () => {
  const base = process.env.URL || "https://caaportal.netlify.app";
  const res = await fetch(`${base}/api/briefing`, { headers: { "x-cron-key": (process.env.IP_HASH_SALT || "").trim().replace(/^["']+|["']+$/g, "") } });
  console.log("briefing", res.status);
};
export const config = { schedule: "0 * * * *" };
