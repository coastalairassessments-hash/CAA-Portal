"use client";
import { useState } from "react";

export default function CopyLink({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="adm-btn"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 2000);
        } catch {
          /* the link is shown above, so it can be copied by hand */
        }
      }}
    >
      {done ? "Copied" : "Copy link"}
    </button>
  );
}
