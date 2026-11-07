"use client";

import Link from "next/link";
import { Fragment, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import {
  ANIMAL_COUNT_FIELD,
  ANIMALS_FIELD,
  CONTACT_FIELDS,
  displayValue,
  type FieldDef,
  type FieldGroup,
  NOTES_FIELD,
  PROFILE_FIELD,
  PROJECT_TYPES,
  projectTypeLabel,
  SITE_FIELDS,
} from "@/lib/quotes/definitions";

const STEPS = ["Projet", "Détails", "Terrain", "Coordonnées", "Récapitulatif"];
const MAX_FILES = 8;
const MAX_FILE_BYTES = 10 * 1024 * 1024;

// ---------------------------------------------------------------------------
// Field rendering (markup mirrors the original form for the stylesheet)
// ---------------------------------------------------------------------------

function Field({ def, name }: { def: FieldDef; name: string }) {
  const label = def.label + (def.required ? " *" : "");
  const wide = def.wide ? "span-2" : undefined;
  const common = { name, required: def.required, "data-label": def.label };

  switch (def.kind) {
    case "checkboxes":
      return (
        <fieldset className={def.wide ? "inline-check span-2" : "inline-check"}>
          <legend>{def.label}</legend>
          {def.options.map((o) => (
            <label key={o}>
              <input type="checkbox" name={name} value={o} /> {o}
            </label>
          ))}
        </fieldset>
      );
    case "select":
      return (
        <label className={wide}>
          {label}
          <select {...common}>
            {def.options.map((o) => (
              <option key={o.value || o.label} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      );
    case "textarea":
      return (
        <label className={wide}>
          {label}
          <textarea {...common} rows={def.rows} placeholder={def.placeholder}></textarea>
        </label>
      );
    default:
      return (
        <label className={wide}>
          {label}
          <input
            {...common}
            type={def.kind === "text" ? undefined : def.kind}
            min={def.min}
            step={def.step}
            inputMode={def.inputMode}
            placeholder={def.placeholder}
            autoComplete={def.autoComplete}
            maxLength={def.maxLength}
            pattern={def.pattern}
          />
        </label>
      );
  }
}

const Grid = ({ fields, prefix }: { fields: FieldDef[]; prefix: string }) => (
  <div className="field-grid">
    {fields.map((f) => (
      <Field key={f.name} def={f} name={`${prefix}.${f.name}`} />
    ))}
  </div>
);

// ---------------------------------------------------------------------------
// Reading the form
// ---------------------------------------------------------------------------

/** What the form posts to /api/devis (validated again on the server). */
interface Collected {
  types: string[];
  details: Record<string, FieldGroup>;
  projectNotes: string;
  site: FieldGroup;
  contact: FieldGroup;
  consent: boolean;
  website: string;
}

function collect(form: HTMLFormElement, types: string[]): Collected {
  const data: Collected = { types, details: {}, projectNotes: "", site: {}, contact: {}, consent: false, website: "" };
  for (const el of Array.from(form.elements) as (HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement)[]) {
    if (!el.name || el.type === "file" || el.name === "types") continue;
    if (el.name === "consent") {
      data.consent = (el as HTMLInputElement).checked;
      continue;
    }
    if (el.name === "website") {
      data.website = el.value;
      continue;
    }
    if (el.name === "projectNotes") {
      data.projectNotes = el.value.trim();
      continue;
    }
    const [group, a, b] = el.name.split(".");
    let target: FieldGroup;
    let key: string;
    if (group === "details" && a && b) {
      if (!types.includes(a)) continue;
      target = data.details[a] ??= {};
      key = b;
    } else if ((group === "site" || group === "contact") && a) {
      target = data[group];
      key = a;
    } else continue;

    if (el.type === "checkbox") {
      if ((el as HTMLInputElement).checked) target[key] = [...((target[key] as string[] | undefined) ?? []), el.value];
    } else if (el.value.trim() !== "") target[key] = el.value.trim();
  }
  return data;
}

function validationMessage(el: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement): string {
  const label = el.dataset.label ?? "Ce champ";
  if (el.type === "checkbox") return "Merci d'accepter l'utilisation de vos informations pour traiter la demande.";
  if (el.validity.valueMissing) return `${label} : champ obligatoire.`;
  if (el.type === "email") return "Adresse e-mail invalide.";
  if (el.name === "site.postalCode") return "Code postal : 5 chiffres.";
  return `${label} : valeur invalide.`;
}

// ---------------------------------------------------------------------------
// Recap
// ---------------------------------------------------------------------------

function RecapTable({ rows }: { rows: [string, string][] }) {
  return (
    <table>
      <tbody>
        {rows.map(([k, v]) => (
          <tr key={k}>
            <th>{k}</th>
            <td>{v}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const rowsFor = (fields: FieldDef[], group: FieldGroup): [string, string][] =>
  fields.filter((f) => group[f.name] !== undefined).map((f) => [f.label, displayValue(group[f.name])]);

function Recap({ data, files }: { data: Collected; files: File[] }) {
  const project: [string, string][] = [["Type(s)", data.types.map(projectTypeLabel).join(", ")]];
  if (data.contact.profile) project.push([PROFILE_FIELD.label, displayValue(data.contact.profile)]);
  project.push(...rowsFor([ANIMALS_FIELD, ANIMAL_COUNT_FIELD], data.site));
  return (
    <>
      <h3>Projet</h3>
      <RecapTable rows={project} />
      {PROJECT_TYPES.filter((t) => data.types.includes(t.id) && Object.keys(data.details[t.id] ?? {}).length).map(
        (t) => (
          <Fragment key={t.id}>
            <h3>{t.label}</h3>
            <RecapTable rows={rowsFor(t.fields, data.details[t.id] ?? {})} />
          </Fragment>
        ),
      )}
      {data.projectNotes && (
        <>
          <h3>Précisions</h3>
          <p>
            {data.projectNotes.split("\n").map((line, i) => (
              <Fragment key={i}>
                {i > 0 && <br />}
                {line}
              </Fragment>
            ))}
          </p>
        </>
      )}
      <h3>Terrain et chantier</h3>
      <RecapTable rows={rowsFor(SITE_FIELDS, data.site)} />
      {files.length > 0 && (
        <p>
          <strong>{files.length} fichier(s) joint(s)</strong> : {files.map((f) => f.name).join(", ")}
        </p>
      )}
      <h3>Coordonnées</h3>
      <RecapTable rows={rowsFor(CONTACT_FIELDS, data.contact)} />
    </>
  );
}

// ---------------------------------------------------------------------------
// The form
// ---------------------------------------------------------------------------

interface Props {
  initialType?: string;
  phone: string;
  aside: ReactNode;
  doneTitle: string;
  doneText: ReactNode;
}

export function QuoteForm({ initialType, phone, aside, doneTitle, doneText }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const stepsRef = useRef<HTMLOListElement>(null);
  const doneBoxRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(1);
  const [types, setTypes] = useState<string[]>(() =>
    initialType && PROJECT_TYPES.some((t) => t.id === initialType) ? [initialType] : [],
  );
  const [files, setFiles] = useState<File[]>([]);
  const [message, setMessage] = useState("");
  const [recap, setRecap] = useState<Collected | null>(null);
  const [sending, setSending] = useState(false);
  /** Reference returned by the server once the request is saved. */
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);
  const shownStep = useRef(step);

  // Bring the stepper into view when the step changes (not on first display).
  useEffect(() => {
    if (shownStep.current === step) return;
    shownStep.current = step;
    stepsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [step]);

  useEffect(() => {
    if (submittedRef !== null) doneBoxRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [submittedRef]);

  const fieldsets = () => Array.from(formRef.current?.querySelectorAll<HTMLFieldSetElement>("fieldset.step") ?? []);

  function validate(n: number): string {
    if (n === 1 && !types.length) return "Choisissez au moins un type de projet.";
    const fs = fieldsets()[n - 1];
    if (!fs) return "";
    for (const el of Array.from(
      fs.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>("input, select, textarea"),
    )) {
      if (el.closest("[hidden]")) continue;
      if (!el.checkValidity()) {
        el.focus();
        return validationMessage(el);
      }
    }
    return "";
  }

  function go(n: number) {
    setMessage("");
    if (n === STEPS.length && formRef.current) setRecap(collect(formRef.current, types));
    setStep(n);
  }

  function next() {
    const err = validate(step);
    if (err) setMessage(err);
    else go(step + 1);
  }

  function addFiles(list: FileList | null) {
    if (!list) return;
    const added: File[] = [];
    for (const f of Array.from(list)) {
      if (files.length + added.length >= MAX_FILES) break;
      if (f.size > MAX_FILE_BYTES) {
        setMessage(`« ${f.name} » dépasse 10 Mo.`);
        continue;
      }
      added.push(f);
    }
    setFiles([...files, ...added]);
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    for (let n = 1; n <= 4; n++) {
      const err = validate(n);
      if (err) {
        setStep(n);
        setMessage(err);
        return;
      }
    }
    setSending(true);
    const body = new FormData();
    body.append("data", JSON.stringify(collect(e.currentTarget, types)));
    files.forEach((f) => body.append("fichiers", f));
    try {
      const res = await fetch("/api/devis", { method: "POST", body });
      const json = (await res.json().catch(() => ({}))) as { ref?: string; error?: string };
      if (!res.ok) throw new Error(json.error);
      setSubmittedRef(json.ref ?? "");
    } catch (err) {
      setMessage((err instanceof Error && err.message) || `L'envoi a échoué. Réessayez ou appelez-nous au ${phone}.`);
      setSending(false);
    }
  }

  const done = submittedRef !== null;

  return (
    <div className="wrap devis">
      <ol className="devis__steps" id="steps" ref={stepsRef} hidden={done}>
        {STEPS.map((label, i) => (
          <li
            key={label}
            className={
              [i + 1 === step && "is-active", i + 1 < step && "is-done"].filter(Boolean).join(" ") || undefined
            }
            onClick={() => i + 1 < step && go(i + 1)}
          >
            <span>{i + 1}</span>
            {label}
          </li>
        ))}
      </ol>

      <form ref={formRef} id="devis-form" className="devis__form" noValidate onSubmit={onSubmit} hidden={done}>
        <fieldset className={step === 1 ? "step is-active" : "step"} data-step="1">
          <legend>Quel est votre projet ?</legend>
          <p className="hint">Plusieurs choix possibles.</p>
          <div className="choice-grid" id="types">
            {PROJECT_TYPES.map((t) => (
              <label className="choice" key={t.id}>
                <input
                  type="checkbox"
                  name="types"
                  value={t.id}
                  checked={types.includes(t.id)}
                  onChange={(e) => setTypes(e.target.checked ? [...types, t.id] : types.filter((x) => x !== t.id))}
                />
                <span>
                  <strong>{t.label}</strong>
                  {t.hint}
                </span>
              </label>
            ))}
          </div>
          <div className="field-grid">
            <Field def={PROFILE_FIELD} name="contact.profile" />
            <Field def={ANIMAL_COUNT_FIELD} name="site.animalCount" />
            <Field def={ANIMALS_FIELD} name="site.animals" />
          </div>
        </fieldset>

        <fieldset className={step === 2 ? "step is-active" : "step"} data-step="2">
          <legend>Détails du projet</legend>
          <p className="hint">
            Indiquez ce que vous savez ; si vous n&apos;êtes pas sûr, laissez vide, nous en parlerons ensemble.
          </p>
          {PROJECT_TYPES.map((t) => (
            <div className="sub" data-for={t.id} key={t.id} hidden={!types.includes(t.id)}>
              <h3>{t.label === "Autre" ? "Autre besoin" : t.label}</h3>
              {t.grid ? (
                <Grid fields={t.fields} prefix={`details.${t.id}`} />
              ) : (
                t.fields.map((f) => <Field key={f.name} def={f} name={`details.${t.id}.${f.name}`} />)
              )}
            </div>
          ))}
          <label className="mt">
            {NOTES_FIELD.label}
            <textarea name="projectNotes" rows={NOTES_FIELD.rows} placeholder={NOTES_FIELD.placeholder}></textarea>
          </label>
        </fieldset>

        <fieldset className={step === 3 ? "step is-active" : "step"} data-step="3">
          <legend>Le terrain et le chantier</legend>
          <Grid fields={SITE_FIELDS} prefix="site" />
          <div className="upload mt">
            <label htmlFor="fichiers">
              <strong>Photos, plan ou croquis</strong> (facultatif, 8 fichiers max., 10 Mo chacun, images ou PDF)
            </label>
            <input
              type="file"
              id="fichiers"
              multiple
              accept="image/*,application/pdf"
              onChange={(e) => {
                addFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <ul className="upload__list" id="file-list">
              {files.map((f, i) => (
                <li key={`${f.name}-${i}`}>
                  {f.name} <span>({(f.size / 1024 / 1024).toFixed(1)} Mo)</span>{" "}
                  <button type="button" aria-label="Retirer" onClick={() => setFiles(files.filter((_, j) => j !== i))}>
                    Retirer
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </fieldset>

        <fieldset className={step === 4 ? "step is-active" : "step"} data-step="4">
          <legend>Vos coordonnées</legend>
          <Grid fields={CONTACT_FIELDS} prefix="contact" />
          <label className="check mt">
            <input type="checkbox" name="consent" required /> J&apos;accepte que les informations saisies soient
            utilisées pour traiter ma demande de devis et me recontacter. *
          </label>
          <input type="text" name="website" className="hp" tabIndex={-1} autoComplete="off" aria-hidden="true" />
        </fieldset>

        <fieldset className={step === 5 ? "step is-active" : "step"} data-step="5">
          <legend>Récapitulatif</legend>
          <p className="hint">Vérifiez votre demande avant de l&apos;envoyer.</p>
          <div className="recap" id="recap">
            {recap && <Recap data={recap} files={files} />}
          </div>
        </fieldset>

        <div className="devis__nav">
          <button type="button" className="btn btn--ghost" id="prev" hidden={step === 1} onClick={() => go(step - 1)}>
            Précédent
          </button>
          <p className="form__msg" id="devis-msg" role="alert">
            {message}
          </p>
          <button type="button" className="btn" id="next" hidden={step === STEPS.length} onClick={next}>
            Continuer
          </button>
          <button type="submit" className="btn" id="submit" hidden={step !== STEPS.length} disabled={sending}>
            {sending ? "Envoi en cours…" : "Envoyer ma demande"}
          </button>
        </div>
      </form>

      <div className="devis__done" id="done" ref={doneBoxRef} hidden={!done}>
        <h2>{doneTitle}</h2>
        <p>
          Référence : <strong id="done-ref">{submittedRef}</strong>
        </p>
        <p>{doneText}</p>
        <p>
          <Link href="/" className="btn">
            Retour à l&apos;accueil
          </Link>
        </p>
      </div>

      {aside}
    </div>
  );
}
