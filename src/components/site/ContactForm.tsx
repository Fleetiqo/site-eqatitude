"use client";

import { useState, type FormEvent } from "react";
import { CONTACT_FORM_ERROR } from "@/lib/quotes/validation";

type Feedback = { kind: "ok" | "error"; text: string } | null;

export function ContactForm({ phone, successText }: { phone: string; successText: string }) {
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [sending, setSending] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form)) as Record<string, string>;
    if (!data.name?.trim() || !data.message?.trim() || (!data.email?.trim() && !data.phone?.trim())) {
      setFeedback({ kind: "error", text: CONTACT_FORM_ERROR });
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(json.error);
      form.reset();
      setFeedback({ kind: "ok", text: successText });
    } catch (err) {
      setFeedback({
        kind: "error",
        text: (err instanceof Error && err.message) || `L'envoi a échoué. Vous pouvez nous appeler au ${phone}.`,
      });
    } finally {
      setSending(false);
    }
  }

  return (
    <form className="form" id="contact-form" noValidate onSubmit={onSubmit}>
      <div className="form__row">
        <label>
          Nom *<input name="name" required autoComplete="name" />
        </label>
        <label>
          Téléphone
          <input name="phone" type="tel" autoComplete="tel" />
        </label>
      </div>
      <label>
        E-mail
        <input name="email" type="email" autoComplete="email" />
      </label>
      <label>
        Objet
        <input name="subject" />
      </label>
      <label>
        Message *<textarea name="message" rows={5} required></textarea>
      </label>
      <input type="text" name="website" className="hp" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <div className="form__foot">
        <button className="btn" type="submit" disabled={sending}>
          Envoyer
        </button>
        <p className={feedback ? `form__msg is-${feedback.kind}` : "form__msg"} role="status">
          {feedback?.text}
        </p>
      </div>
    </form>
  );
}
