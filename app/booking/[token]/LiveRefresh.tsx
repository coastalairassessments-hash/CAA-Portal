"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

// On visit day, quietly reloads the page so the client sees the status change.
export default function LiveRefresh() {
  const router = useRouter();
  useEffect(() => {
    const t = setInterval(() => router.refresh(), 30000);
    return () => clearInterval(t);
  }, [router]);
  return null;
}
