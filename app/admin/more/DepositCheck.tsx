"use client";
import { useActionState } from "react";
import { checkDeposits, type DepositCheckState } from "../actions";

export default function DepositCheck() {
  const [state, action, pending] = useActionState<DepositCheckState, FormData>(async (prev) => checkDeposits(prev), { message: null, ok: false });
  return (
    <form action={action} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <button className="adm-btn wide" type="submit" disabled={pending}>
        {pending ? "Testing..." : "Test deposit payments"}
      </button>
      {state.message && <p className={state.ok ? "adm-ok" : "adm-err"} role="status">{state.message}</p>}
    </form>
  );
}
