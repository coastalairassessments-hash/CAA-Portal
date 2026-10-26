"use client";
import { useActionState } from "react";
import { login, type LoginState } from "../actions";

export default function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, { error: null });
  return (
    <form action={action} className="adm-group">
      <div className="adm-field">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="username" required />
      </div>
      <div className="adm-field">
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required />
      </div>
      {state.error && <p className="adm-err" role="alert">{state.error}</p>}
      <button className="adm-btn primary wide" type="submit" disabled={pending}>
        {pending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
