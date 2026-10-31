"use client";
import { useEffect, useRef, useState } from "react";
import type { Parsed, Suggestion } from "@/lib/address";

// A street address box that offers matches as you type. If suggestions are not available it is just a text box.
export default function AddressField({
  value,
  onChange,
  onPick,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  onPick: (p: Parsed) => void;
  error?: string;
}) {
  const [items, setItems] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const typed = useRef(false); // only suggest after the person types, not after a pick

  useEffect(() => {
    if (!typed.current || value.trim().length < 4) {
      setItems([]);
      return;
    }
    const ctl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/address?q=${encodeURIComponent(value.trim())}`, { signal: ctl.signal });
        const data = await res.json();
        setItems(data.suggestions ?? []);
        setOpen(true);
      } catch {
        /* typing still works without suggestions */
      }
    }, 250);
    return () => {
      clearTimeout(t);
      ctl.abort();
    };
  }, [value]);

  async function choose(s: Suggestion) {
    typed.current = false;
    setOpen(false);
    setItems([]);
    try {
      const res = await fetch(`/api/address?id=${encodeURIComponent(s.id)}`);
      const data = await res.json();
      if (data.place) {
        onPick(data.place as Parsed);
        return;
      }
    } catch {
      /* fall through to what they typed */
    }
    onChange(s.text.split(",")[0] ?? s.text);
  }

  return (
    <div className="field addr">
      <label htmlFor="address">Property address</label>
      <input
        id="address"
        type="text"
        autoComplete="off"
        autoCorrect="off"
        role="combobox"
        aria-expanded={open && items.length > 0}
        aria-controls="address-list"
        aria-autocomplete="list"
        value={value}
        onChange={(e) => {
          typed.current = true;
          onChange(e.target.value);
        }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onFocus={() => items.length > 0 && setOpen(true)}
        aria-invalid={!!error}
        aria-describedby={error ? "address-err" : undefined}
      />
      {open && items.length > 0 && (
        <ul className="addr-list" id="address-list" role="listbox">
          {items.map((s) => (
            <li key={s.id} role="option" aria-selected={false}>
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => choose(s)}>
                {s.text.replace(/, USA$/, "")}
              </button>
            </li>
          ))}
        </ul>
      )}
      {error && <p className="error" id="address-err">{error}</p>}
    </div>
  );
}
