// Our emails are written as plain text. This makes the same words into a simple HTML email, so every
// web address is a tap-able link and the booking page gets a real button. The plain text still goes along.
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Web addresses, without the full stop or bracket that often trails them in a sentence.
const URL_RE = /https?:\/\/[^\s<>"]+[^\s<>".,;:!?)\]]/g;

const link = (u: string) => `<a href="${esc(u)}" style="color:#1f4e79">${esc(u)}</a>`;

const BUTTON = "display:inline-block;background:#1f4e79;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 22px;border-radius:8px";

export function textToHtml(text: string): string {
  const out = text.split("\n").map((raw) => {
    const line = raw.trimEnd();
    if (!line.trim()) return "<br>";
    // "Your booking, any time: https://..." becomes a label and a button.
    const m = line.match(/^(Your booking[^:]*):\s*(https?:\/\/\S+)$/);
    if (m) {
      return `<p style="margin:14px 0">${esc(m[1])}:<br><a href="${esc(m[2])}" style="${BUTTON}">Open your booking page</a></p>`;
    }
    const withLinks = line.split(URL_RE).reduce<string[]>((acc, part, i, parts) => {
      acc.push(esc(part));
      if (i < parts.length - 1) acc.push(link(line.match(URL_RE)![i]));
      return acc;
    }, []).join("");
    return `<div>${withLinks}</div>`;
  });
  return `<div style="font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.5;color:#1b2430">${out.join("")}</div>`;
}
