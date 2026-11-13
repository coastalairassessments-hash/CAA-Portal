"use client";

export default function PrintButton() {
  return (
    <button className="btn btn-quiet" type="button" onClick={() => window.print()}>
      Print or save as PDF
    </button>
  );
}
