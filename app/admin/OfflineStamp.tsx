"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { STAMP_KEY, dequeue, enqueue, parseQueue, waiting, type Queued, type StampKind } from "@/lib/stampQueue";
import { syncStamp } from "./stampActions";

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
export default function OfflineStamp({ id, which, label, className }: { id: string; which: StampKind; label: string; className?: string }) {
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

  async function tap() {
    write(enqueue(read(), { id, which, at: new Date().toISOString() }));
    setPending(true);
    await flush();
  }

  return (
    <div>
      <button type="button" className={className} onClick={tap} disabled={pending} style={{ minHeight: 48, width: "100%" }}>
        {pending ? `${label} saved` : label}
      </button>
      {pending && <p className="adm-muted" role="status">Saved on this phone. Sends when you have signal.</p>}
    </div>
  );
}
