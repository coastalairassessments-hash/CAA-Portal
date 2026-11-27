"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { STAMP_KEY, dequeue, enqueue, parseQueue, waiting, type Queued, type StampKind } from "@/lib/stampQueue";
import { syncStamp } from "./stampActions";
import { ETA_CHOICES, etaSmsLink } from "@/lib/eta";

const read = (): Queued[] => {
  try {
    return parseQueue(localStorage.getItem(STAMP_KEY));
  } catch {
    return [];
  }
};
const write = (q: Queued[]) => {
  try {
    localStorage.setItem(STAMP_KEY, JSON.stringify(q));
  } catch {
    /* storage can be blocked; the tap then only works online */
  }
};

const withTimeout = <T,>(p: Promise<T>, ms: number) =>
  Promise.race([p, new Promise<never>((_, rej) => setTimeout(() => rej(new Error("slow")), ms))]);

// A stamp button that still works with no signal. The tap is saved on the phone with its real time
// and sent when the signal returns.
// With etaText set, "On my way" becomes four buttons (15, 30, 45, 60 minutes). Each saves the tap and opens
// Messages with the arrival time already written; Cory only presses send.
export type EtaText = { phone: string; name: string; link: string | null };

export default function OfflineStamp({ id, which, label, className, etaText }: { id: string; which: StampKind; label: string; className?: string; etaText?: EtaText }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const flush = useCallback(async () => {
    for (const item of read()) {
      try {
        const res = await withTimeout(syncStamp(item), 10_000);
        if (res.ok) {
          write(dequeue(read(), item));
          if (item.id === id && item.which === which) setPending(false);
          router.refresh();
        }
      } catch {
        return; // still offline: leave it queued
      }
    }
  }, [id, which, router]);

  useEffect(() => {
    Promise.resolve().then(() => {
      setPending(waiting(read(), id, which));
      return flush();
    });
    const t = setInterval(flush, 30_000);
    window.addEventListener("online", flush);
    return () => {
      clearInterval(t);
      window.removeEventListener("online", flush);
    };
  }, [id, which, flush]);

  async function tap(minutes?: number) {
    const now = new Date();
    write(enqueue(read(), { id, which, at: now.toISOString() }));
    setPending(true);
    // Open Messages first, inside the tap, so the phone allows it. The save carries on behind it.
    if (etaText && minutes) window.location.assign(etaSmsLink(etaText.phone, etaText, minutes, now, etaText.link));
    await flush();
  }

  if (etaText && !pending) {
    return (
      <div>
        <p className="adm-muted" style={{ margin: "0 0 6px" }}>{label}: how long?</p>
        <div className="adm-row">
          {ETA_CHOICES.map((m) => (
            <button key={m} type="button" className={className} onClick={() => tap(m)} style={{ minHeight: 48 }}>
              {m} min
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <button type="button" className={className} onClick={() => tap()} disabled={pending} style={{ minHeight: 48, width: "100%" }}>
        {pending ? `${label} saved` : label}
      </button>
      {pending && <p className="adm-muted" role="status">Saved on this phone. Sends when you have signal.</p>}
    </div>
  );
}
