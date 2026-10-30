"use client";
import { useEffect, useState } from "react";
import { savePhone, sendTestAlert } from "../actions";

const toKey = (b64: string) => {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
};

export default function PushToggle({ publicKey }: { publicKey: string }) {
  const [state, setState] = useState<"checking" | "unsupported" | "off" | "on" | "denied" | "busy" | "failed">("checking");

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
      queueMicrotask(() => setState("unsupported"));
      return;
    }
    navigator.serviceWorker.getRegistration().then(async (reg) => {
      const sub = await reg?.pushManager.getSubscription();
      setState(sub ? "on" : Notification.permission === "denied" ? "denied" : "off");
    }).catch(() => setState("off"));
  }, []);

  async function turnOn() {
    setState("busy");
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") return setState("denied");
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: toKey(publicKey) });
      const j = sub.toJSON();
      const res = await savePhone({ endpoint: sub.endpoint, p256dh: j.keys?.p256dh ?? "", auth: j.keys?.auth ?? "" });
      setState(res.ok ? "on" : "failed");
    } catch {
      setState("failed");
    }
  }

  const [test, setTest] = useState("");
  async function sendTest() {
    setTest("Sending...");
    const r = await sendTestAlert();
    setTest(r.sent ? "Sent. Check your phone." : "Nothing sent. Turn alerts off and on again.");
  }

  const note: Record<typeof state, string> = {
    checking: "",
    unsupported: "To get alerts, add this app to your Home Screen (Share, then Add to Home Screen), open it from there, and come back here.",
    off: "Get an alert for new requests, plus today's inspections at 7 AM and tomorrow's at 7 PM.",
    on: "Alerts are on for this phone.",
    denied: "Alerts are blocked. Turn them on for this app in your phone's Settings, then come back.",
    busy: "Turning on...",
    failed: "Could not turn on alerts. Try again.",
  };
  return (
    <section className="adm-group">
      <h2>Alerts</h2>
      <p className="adm-muted">{note[state]}</p>
      {(state === "off" || state === "failed") && (
        <button className="adm-btn wide primary" type="button" onClick={turnOn}>Turn on alerts</button>
      )}
      {state === "on" && (
        <>
          <button className="adm-btn wide" type="button" onClick={sendTest}>Send a test alert</button>
          {test && <p className="adm-muted">{test}</p>}
        </>
      )}
    </section>
  );
}
