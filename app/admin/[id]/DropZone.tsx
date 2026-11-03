"use client";
import { useRef, useState } from "react";

// A drop box for the PDF. Click to choose, or drag a file onto it. The form still works without JavaScript.
export default function DropZone({ id = "report-file" }: { id?: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [over, setOver] = useState(false);
  return (
    <div
      className={`adm-drop${over ? " over" : ""}`}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const f = e.dataTransfer.files?.[0];
        if (f && input.current) {
          const dt = new DataTransfer();
          dt.items.add(f);
          input.current.files = dt.files;
          setName(f.name);
        }
      }}
    >
      <label htmlFor={id}>{name || "Drop the finished PDF here, or click to choose"}</label>
      <input ref={input} id={id} name="report" type="file" accept="application/pdf" required onChange={(e) => setName(e.target.files?.[0]?.name ?? "")} />
    </div>
  );
}
