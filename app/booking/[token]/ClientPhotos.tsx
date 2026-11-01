"use client";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addClientPhoto } from "../actions";
import { shrinkPhoto } from "@/lib/shrinkPhoto";

export default function ClientPhotos({ token, sent }: { token: string; sent: number }) {
  const input = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  async function onPick(files: FileList | null) {
    if (!files?.length) return;
    setMsg("Sending...");
    let saved = 0;
    let limit = false;
    for (const f of Array.from(files)) {
      const blob = await shrinkPhoto(f);
      if (!blob) continue;
      const form = new FormData();
      form.set("token", token);
      form.set("photo", new File([blob], "photo.jpg", { type: "image/jpeg" }));
      const res = await addClientPhoto(form);
      if (res.ok) saved++;
      if (res.error === "limit") limit = true;
    }
    if (input.current) input.current.value = "";
    setMsg(limit ? "That is the most we can take. Thank you." : saved === files.length ? `Sent ${saved}. Thank you.` : "Some did not send. Please try again.");
    start(() => router.refresh());
  }

  return (
    <div>
      <input ref={input} type="file" accept="image/*" multiple hidden onChange={(e) => onPick(e.target.files)} />
      <button type="button" className="btn btn-quiet" disabled={pending} onClick={() => input.current?.click()}>
        Add photos
      </button>
      {sent > 0 && <p className="muted">{sent} sent so far.</p>}
      {msg && <p role="status">{msg}</p>}
    </div>
  );
}
