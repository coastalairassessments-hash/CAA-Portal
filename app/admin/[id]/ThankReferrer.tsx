"use client";
import { useState } from "react";
import { markReferrerThanked } from "../referralActions";

// Opens Messages with the thank-you written, and records it, so the reminder on Home goes away.
export default function ThankReferrer({ id, href }: { id: string; href: string }) {
  const [done, setDone] = useState(false);
  if (done) return <p className="adm-ok">Referrer thanked.</p>;
  return (
    <a
      className="adm-btn primary wide"
      href={href}
      onClick={() => {
        void markReferrerThanked(id).then((r) => r.ok && setDone(true));
      }}
    >
      Thank the referrer
    </a>
  );
}
