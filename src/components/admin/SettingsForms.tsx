"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { formatDateTime } from "@/lib/format";
import { isValidSlots } from "@/lib/hours";
import { VAT_RATES } from "@/lib/quotes/pricing";
import type { BusinessInfo, LegalInfo, OpeningDay, Settings } from "@/lib/types";
import { changePassword } from "@/server/actions/auth";
import { restoreBackup } from "@/server/actions/backup";
import { saveBrands, saveLegal, saveShopSettings } from "@/server/actions/content";
import { useAdminUi } from "./AdminUi";

const fd = (e: FormEvent<HTMLFormElement>) => {
  const data = new FormData(e.currentTarget);
  return (k: string) => String(data.get(k) ?? "").trim();
};

// --- Marques ---------------------------------------------------------------------

export function BrandsForm({ brands }: { brands: string[] }) {
  const { run } = useAdminUi();
  return (
    <>
      <h1>Marques</h1>
      <p className="muted">Une marque par ligne, dans l&apos;ordre d&apos;affichage sur la page Équitation.</p>
      <form
        className="form"
        onSubmit={(e) => {
          e.preventDefault();
          const names = fd(e)("brands")
            .split("\n")
            .map((x) => x.trim())
            .filter(Boolean);
          run(saveBrands(names), "Marques enregistrées");
        }}
      >
        <section className="panel pad">
          <textarea name="brands" rows={14} defaultValue={brands.join("\n")} aria-label="Marques" />
        </section>
        <div className="sticky-save">
          <button className="btn">Enregistrer</button>
        </div>
      </form>
    </>
  );
}

// --- Infos & horaires -------------------------------------------------------

const BUSINESS_FIELDS: [keyof BusinessInfo, string, string?][] = [
  ["name", "Nom de l'enseigne"],
  ["email", "E-mail", "email"],
  ["phone", "Téléphone affiché"],
  ["phoneIntl", "Téléphone (format international)"],
  ["address", "Adresse"],
  ["city", "Code postal et ville"],
  ["facebook", "Page Facebook"],
  ["instagram", "Compte Instagram"],
  ["mapQuery", "Adresse pour la carte Google Maps"],
];

export function ShopSettingsForm({ settings, hours }: { settings: Settings; hours: OpeningDay[] }) {
  const { run, toast } = useAdminUi();
  const [slots, setSlots] = useState(hours.map((h) => h.slots));
  const { announcement: a, google: g, business: b } = settings;

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const get = fd(e);
    const form = e.currentTarget;
    const bad = slots.find((s) => !isValidSlots(s));
    if (bad !== undefined) return toast(`Horaire mal écrit : « ${bad} »`, true);
    const checked = (name: string) => (form.elements.namedItem(name) as HTMLInputElement).checked;
    run(
      saveShopSettings({
        business: { ...b, ...Object.fromEntries(BUSINESS_FIELDS.map(([k]) => [k, get(k)])) },
        announcement: { enabled: checked("annEnabled"), text: get("annText"), from: get("annFrom"), to: get("annTo") },
        google: {
          enabled: checked("gEnabled"),
          note: get("gNote"),
          reviewCount: Number(get("gCount")) || 0,
          url: get("gUrl"),
        },
        hours: hours.map((h, i) => ({ day: h.day, slots: slots[i]?.trim() ?? "" })),
      }),
      "Informations enregistrées",
    );
  }

  return (
    <>
      <h1>Infos &amp; horaires</h1>
      <form className="form" onSubmit={onSubmit}>
        <section className="panel pad">
          <h2>Bandeau d&apos;annonce</h2>
          <p className="muted">
            Promotion, arrivage, événement… Affiché en haut de toutes les pages, éventuellement entre deux dates.
          </p>
          <label className="check">
            <input type="checkbox" name="annEnabled" defaultChecked={a.enabled} /> Afficher l&apos;annonce
          </label>
          <label>
            Texte
            <input
              name="annText"
              defaultValue={a.text}
              placeholder="ex. −20 % sur les couvertures jusqu'au 3 octobre"
            />
          </label>
          <div className="grid-2">
            <label>
              À partir du (facultatif)
              <input type="date" name="annFrom" defaultValue={a.from} />
            </label>
            <label>
              Jusqu&apos;au (facultatif)
              <input type="date" name="annTo" defaultValue={a.to} />
            </label>
          </div>
        </section>
        <section className="panel pad">
          <h2>Horaires d&apos;ouverture</h2>
          <p className="muted">
            Format : <code>09:00-12:30, 14:00-19:00</code>. Laisser vide si fermé. Pour une fermeture ponctuelle,
            utilisez <Link href="/admin/contenu/fermetures">Fermetures exceptionnelles</Link>.
          </p>
          <table className="hours-edit">
            <tbody>
              {hours.map((d, i) => (
                <tr key={d.day}>
                  <th>{d.day}</th>
                  <td>
                    <input
                      value={slots[i]}
                      placeholder="Fermé"
                      aria-invalid={!isValidSlots(slots[i] ?? "")}
                      onChange={(e) => setSlots(slots.map((s, j) => (j === i ? e.target.value : s)))}
                    />
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn btn--ghost btn--xs"
                      disabled={i === 0}
                      onClick={() => setSlots(slots.map((s, j) => (j === i ? (slots[i - 1] ?? "") : s)))}
                    >
                      = veille
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <section className="panel pad">
          <h2>Note Google</h2>
          <p className="muted">
            Affichée sur l&apos;accueil (section « Ils nous font confiance »), avec un lien vers vos avis Google. Pensez
            à la mettre à jour de temps en temps.
          </p>
          <label className="check">
            <input type="checkbox" name="gEnabled" defaultChecked={g.enabled} /> Afficher la note Google
          </label>
          <div className="grid-3">
            <label>
              Note (sur 5)
              <input name="gNote" defaultValue={g.note} placeholder="4,3" />
            </label>
            <label>
              Nombre d&apos;avis
              <input name="gCount" type="number" min={0} defaultValue={g.reviewCount} />
            </label>
            <label>
              Lien vers la fiche Google
              <input name="gUrl" defaultValue={g.url} />
            </label>
          </div>
        </section>
        <section className="panel pad">
          <h2>Coordonnées</h2>
          <div className="grid-2">
            {BUSINESS_FIELDS.map(([k, label, type]) => (
              <label key={k}>
                {label}
                <input name={k} type={type} defaultValue={b[k]} />
              </label>
            ))}
          </div>
        </section>
        <div className="sticky-save">
          <button className="btn">Enregistrer</button>
        </div>
      </form>
    </>
  );
}

// --- Documents de devis ---------------------------------------------------

export function LegalForm({ legal: L }: { legal: LegalInfo }) {
  const { run } = useAdminUi();
  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const get = fd(e);
    run(
      saveLegal({
        companyName: get("companyName"),
        legalForm: get("legalForm"),
        siret: get("siret"),
        vatNumber: get("vatNumber"),
        defaultVatRate: Number(get("defaultVatRate")),
        quoteValidityDays: Number(get("quoteValidityDays")) || 30,
        quoteConditions: get("quoteConditions"),
      }),
      "Réglages des devis enregistrés",
    );
  }
  return (
    <>
      <h1>Documents de devis</h1>
      <p className="muted">
        Informations reprises sur les devis générés depuis la console (en-tête, pied de page, conditions par défaut).
      </p>
      <form className="form" onSubmit={onSubmit}>
        <section className="panel pad">
          <h2>Entreprise</h2>
          <div className="grid-2">
            <label>
              Raison sociale
              <input name="companyName" defaultValue={L.companyName} />
            </label>
            <label>
              Forme juridique et capital
              <input name="legalForm" defaultValue={L.legalForm} placeholder="ex. SARL au capital de 10 000 €" />
            </label>
            <label>
              SIRET
              <input name="siret" defaultValue={L.siret} />
            </label>
            <label>
              N° TVA intracommunautaire
              <input name="vatNumber" defaultValue={L.vatNumber} />
            </label>
          </div>
        </section>
        <section className="panel pad">
          <h2>Valeurs par défaut</h2>
          <div className="grid-2">
            <label>
              TVA par défaut
              <select name="defaultVatRate" defaultValue={String(L.defaultVatRate)}>
                {VAT_RATES.map((t) => (
                  <option key={t} value={t}>
                    {t} %
                  </option>
                ))}
              </select>
            </label>
            <label>
              Validité des devis (jours)
              <input type="number" name="quoteValidityDays" min={1} defaultValue={L.quoteValidityDays} />
            </label>
          </div>
          <label>
            Conditions et mentions par défaut
            <textarea name="quoteConditions" rows={5} defaultValue={L.quoteConditions} />
          </label>
        </section>
        <div className="sticky-save">
          <button className="btn">Enregistrer</button>
        </div>
      </form>
    </>
  );
}

// --- Sauvegarde --------------------------------------------------------------

export function BackupPanel() {
  const { run, confirm, toast } = useAdminUi();
  const [file, setFile] = useState<File | null>(null);
  const [all, setAll] = useState(false);

  async function restore() {
    if (!file) return toast("Choisissez un fichier de sauvegarde.", true);
    const text = await file.text();
    let createdAt = "";
    try {
      createdAt = (JSON.parse(text) as { createdAt?: string }).createdAt ?? "";
    } catch {
      return toast("Fichier illisible.", true);
    }
    const when = createdAt ? ` du ${formatDateTime(createdAt)}` : "";
    if (!(await confirm(`Restaurer la sauvegarde${when} ? Le contenu actuel sera remplacé.`, "Restaurer"))) return;
    await run(restoreBackup(text, all), "Sauvegarde restaurée");
  }

  return (
    <>
      <h1>Sauvegarde</h1>
      <div className="dash-grid">
        <section className="panel pad">
          <h2>Télécharger une sauvegarde</h2>
          <p className="muted">
            Un fichier contenant tout le contenu du site, les demandes de devis et les messages. À faire régulièrement
            et à conserver en lieu sûr. (Les photos sont dans le dossier <code>storage/uploads/</code> du serveur.)
          </p>
          <a className="btn" href="/api/admin/backup" download>
            Télécharger la sauvegarde
          </a>
        </section>
        <section className="panel pad">
          <h2>Restaurer</h2>
          <p className="muted">
            Remplace le contenu du site par celui d&apos;une sauvegarde (y compris une sauvegarde de l&apos;ancienne
            version du site). Une copie du contenu actuel est conservée sur le serveur avant restauration.
          </p>
          <input type="file" accept="application/json,.json" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          <label className="check">
            <input type="checkbox" checked={all} onChange={(e) => setAll(e.target.checked)} /> Restaurer aussi les devis
            et les messages
          </label>
          <button className="btn btn--danger" onClick={restore}>
            Restaurer
          </button>
        </section>
      </div>
    </>
  );
}

// --- Compte ------------------------------------------------------------------

export function PasswordForm() {
  const { run } = useAdminUi();
  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const get = fd(e);
    const ok = await run(
      changePassword({ current: get("current"), next: get("next"), confirm: get("confirm") }),
      "Mot de passe modifié",
    );
    if (ok !== undefined) form.reset();
  }
  return (
    <>
      <h1>Compte</h1>
      <form className="form panel pad narrow" onSubmit={onSubmit}>
        <h2>Changer le mot de passe</h2>
        <label>
          Mot de passe actuel
          <input type="password" name="current" autoComplete="current-password" required />
        </label>
        <label>
          Nouveau mot de passe (8 caractères minimum)
          <input type="password" name="next" autoComplete="new-password" minLength={8} required />
        </label>
        <label>
          Confirmer
          <input type="password" name="confirm" autoComplete="new-password" required />
        </label>
        <button className="btn">Mettre à jour</button>
        <p className="muted small">Les autres appareils connectés seront déconnectés.</p>
      </form>
    </>
  );
}
