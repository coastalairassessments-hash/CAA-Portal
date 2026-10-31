"use client";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addPhoto } from "../fieldActions";

const MAX_SIDE = 1600;

// Shrinks a phone photo to a small JPEG before it is sent, so uploads are quick on a weak signal.
async function shrink(file: File): Promise<Blob | null> {
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext("2d")?.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    return await new Promise((res) => canvas.toBlob(res, "image/jpeg", 0.72));
  } catch {
    return null;
  }
}

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
      const blob = await shrink(f);
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
