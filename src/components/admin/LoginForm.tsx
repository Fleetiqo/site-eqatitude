"use client";

import { useState, type FormEvent } from "react";
import { login } from "@/server/actions/auth";

export function LoginForm() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const password = String(new FormData(e.currentTarget).get("password") ?? "");
    const res = await login(password); // redirects on success
    if (!res.ok) setError(res.error);
    setBusy(false);
  }

  return (
    <div className="login">
      <form className="login__box" onSubmit={onSubmit}>
        <img src="/img/logo-full.jpg" alt="" width={96} height={72} />
        <h1>Administration</h1>
        <p>Sellerie Equ&apos;Attitud</p>
        <label>
          Mot de passe
          <input type="password" name="password" autoComplete="current-password" required autoFocus />
        </label>
        <button className="btn" type="submit" disabled={busy}>
          Se connecter
        </button>
        <p className="err" role="alert">
          {error}
        </p>
      </form>
    </div>
  );
}
