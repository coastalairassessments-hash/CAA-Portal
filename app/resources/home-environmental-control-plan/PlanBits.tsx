import type { PlanBlock } from "@/lib/controlPlan";

export function PlanBlocks({ blocks }: { blocks: PlanBlock[] }) {
  return (
    <>
      {blocks.map((b, i) => {
        if (b.kind === "p") return <p key={i}>{b.text}</p>;
        if (b.kind === "ul") return <ul key={i}>{b.items.map((t) => <li key={t}>{t}</li>)}</ul>;
        if (b.kind === "bar")
          return (
            <ol className="plan-bar" key={i}>
              {b.segments.map((s) => (
                <li key={s.label} className={`tone-${s.tone}`}>
                  <strong>{s.label}</strong>
                  <span>{s.note}</span>
                </li>
              ))}
            </ol>
          );
        return (
          <div className="guide-table plan-table" key={i} role="region" tabIndex={0} aria-label="Table">
            <table>
              <thead><tr>{b.head.map((h, hi) => <th key={hi} scope="col">{h}</th>)}</tr></thead>
              <tbody>{b.rows.map((r, ri) => <tr key={ri}>{r.map((c, ci) => (ci === 0 ? <th key={ci} scope="row">{c}</th> : <td key={ci}>{c}</td>))}</tr>)}</tbody>
            </table>
          </div>
        );
      })}
    </>
  );
}
