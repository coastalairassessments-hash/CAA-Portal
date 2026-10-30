"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

// On visit day, quietly reloads the page so the client sees the status change.
export default function LiveRefresh({ every = 30000 }: { every?: number }) {
  const router = useRouter();
  useEffect(() => {
    const t = setInterval(() => router.refresh(), every);
    return () => clearInterval(t);
  }, [router, every]);
  return null;
}
