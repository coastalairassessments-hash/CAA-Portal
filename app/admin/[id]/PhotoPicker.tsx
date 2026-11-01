"use client";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addPhoto } from "../fieldActions";
import { shrinkPhoto } from "@/lib/shrinkPhoto";

export default function PhotoPicker({ id }: { id: string }) {
  const input = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  async function onPick(files: FileList | null) {
    if (!files?.length) return;
    setMsg("Saving...");
    let saved = 0;
    for (const f of Array.from(files)) {
      const blob = await shrinkPhoto(f);
      if (!blob) continue;
      const form = new FormData();
      form.set("id", id);
      form.set("photo", new File([blob], "photo.jpg", { type: "image/jpeg" }));
      const res = await addPhoto(form);
      if (res.ok) saved++;
    }
    if (input.current) input.current.value = "";
    setMsg(saved === files.length ? null : saved ? `Saved ${saved} of ${files.length}. Try the rest again.` : "That did not save. Try again.");
    start(() => router.refresh());
  }

  return (
    <div>
      <input ref={input} type="file" accept="image/*" multiple hidden onChange={(e) => onPick(e.target.files)} />
      <button type="button" className="adm-btn wide" disabled={pending} onClick={() => input.current?.click()}>
        Add photos
      </button>
      {msg && <p className="adm-muted">{msg}</p>}
    </div>
  );
}
