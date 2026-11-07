"use client";

import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { PROJECT_TYPES, QUOTE_SOURCES } from "@/lib/quotes/definitions";
import { createManualQuote } from "@/server/actions/quotes";
import { useAdminUi } from "./AdminUi";

export function NewQuoteForm() {
  const { run } = useAdminUi();
  const router = useRouter();

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const get = (k: string) => String(fd.get(k) ?? "").trim();
    const created = await run(
      createManualQuote({
        source: get("source"),
        types: fd.getAll("types").map(String),
        description: get("description"),
        city: get("city"),
        postalCode: get("postalCode"),
        contact: {
          lastName: get("lastName"),
          firstName: get("firstName"),
          phone: get("phone"),
          email: get("email"),
          organization: get("organization"),
        },
      }),
    );
    if (created) router.push(`/admin/devis/${created.id}`);
  }

  return (
    <form className="form panel pad" onSubmit={onSubmit}>
      <div className="grid-2">
        <label>
          Nom *<input name="lastName" required />
        </label>
        <label>
          Prénom
          <input name="firstName" />
        </label>
        <label>
          Téléphone
          <input name="phone" type="tel" />
        </label>
        <label>
          E-mail
          <input name="email" type="email" />
        </label>
        <label>
          Structure (écurie, élevage…)
          <input name="organization" />
        </label>
        <label>
          Origine de la demande
          <select name="source">
            {QUOTE_SOURCES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label>
          Commune du projet
          <input name="city" />
        </label>
        <label>
          Code postal
          <input name="postalCode" inputMode="numeric" maxLength={5} />
        </label>
      </div>
      <fieldset className="checks">
        <legend>Projet</legend>
        {PROJECT_TYPES.map((t) => (
          <label className="check" key={t.id}>
            <input type="checkbox" name="types" value={t.id} /> {t.shortLabel}
          </label>
        ))}
      </fieldset>
      <label>
        Description du besoin
        <textarea name="description" rows={5} placeholder="Longueurs, dimensions, matériaux, délai…"></textarea>
      </label>
      <div className="actions">
        <button className="btn">Créer la demande</button>
      </div>
    </form>
  );
}
