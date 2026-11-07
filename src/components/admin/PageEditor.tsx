"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { BLOCK_PAGES, BLOCKS, blocksBySection, type BlockKey, type PageId, type Texts } from "@/content/blocks";
import { resetPageBlocks, savePageBlocks } from "@/server/actions/content";
import { useAdminUi } from "./AdminUi";
import { ImageField } from "./ImageField";

const RICH_HELP =
  "Mise en forme : **gras**, *italique*, [texte du lien](/devis), {telephone}, {email}. Une ligne vide crée un nouveau paragraphe.";

function BlockInput({ k, value, onChange }: { k: BlockKey; value: string; onChange: (v: string) => void }) {
  const def = BLOCKS[k];
  const changed = value !== def.default;
  const reset = changed ? (
    <button type="button" className="btn btn--ghost btn--xs" onClick={() => onChange(def.default)} title={def.default}>
      Texte d&apos;origine
    </button>
  ) : null;

  if (def.kind === "image")
    return (
      <ImageField label={def.label} value={value} onChange={onChange} help={def.help} defaultValue={def.default} />
    );

  const rows =
    def.kind === "text" ? 0 : Math.min(10, Math.max(3, Math.ceil(value.length / 90) + value.split("\n").length));
  return (
    <div className="block-field">
      <label>
        <span className="block-field__label">
          {def.label}
          {changed && <span className="ok small"> · modifié</span>}
        </span>
        {def.kind === "text" ? (
          <input value={value} onChange={(e) => onChange(e.target.value)} />
        ) : (
          <textarea rows={rows} value={value} onChange={(e) => onChange(e.target.value)} />
        )}
      </label>
      {(def.help || def.kind === "rich" || def.kind === "lines" || reset) && (
        <p className="block-field__help muted small">
          {def.help ?? (def.kind === "rich" ? RICH_HELP : def.kind === "lines" ? "Un élément par ligne." : "")} {reset}
        </p>
      )}
    </div>
  );
}

export function PageEditor({ page, texts }: { page: PageId; texts: Texts }) {
  const { run, confirm } = useAdminUi();
  const sections = blocksBySection(page);
  const keys = sections.flatMap((s) => s.keys);
  const [values, setValues] = useState(
    () => Object.fromEntries(keys.map((k) => [k, texts[k]])) as Record<BlockKey, string>,
  );
  const dirty = keys.some((k) => values[k] !== texts[k]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    await run(savePageBlocks(values), "Page enregistrée");
  }

  async function resetAll() {
    if (
      !(await confirm(`Rétablir tous les textes et images d'origine de « ${BLOCK_PAGES[page].label} » ?`, "Rétablir"))
    )
      return;
    if ((await run(resetPageBlocks(keys), "Textes d'origine rétablis")) !== undefined) {
      setValues(Object.fromEntries(keys.map((k) => [k, BLOCKS[k].default])) as Record<BlockKey, string>);
    }
  }

  return (
    <>
      <div className="head-row">
        <h1>Pages, textes &amp; visuels</h1>
        <a className="btn btn--ghost" href={BLOCK_PAGES[page].path} target="_blank" rel="noopener">
          Voir la page ↗
        </a>
      </div>
      <p className="muted">
        Tous les textes et photos du site. Les modifications sont visibles immédiatement après l&apos;enregistrement.
        Les listes (rayons, offres, nouveautés…) se gèrent dans leurs rubriques.
      </p>
      <div className="tabs tabs--wrap">
        {(Object.keys(BLOCK_PAGES) as PageId[]).map((p) => (
          <Link key={p} href={`/admin/pages?page=${p}`} className={p === page ? "is-active" : undefined}>
            {BLOCK_PAGES[p].label}
          </Link>
        ))}
      </div>
      <form className="form" onSubmit={onSubmit}>
        {sections.map((s) => (
          <section className="panel pad" key={s.section}>
            <h2>{s.section}</h2>
            {/* Texts first, photos in their own row so tall previews don't break the grid. */}
            {[s.keys.filter((k) => BLOCKS[k].kind !== "image"), s.keys.filter((k) => BLOCKS[k].kind === "image")]
              .filter((group) => group.length)
              .map((group, i) => (
                <div className="block-grid" key={i}>
                  {group.map((k) => (
                    <BlockInput
                      key={k}
                      k={k}
                      value={values[k]}
                      onChange={(v) => setValues((prev) => ({ ...prev, [k]: v }))}
                    />
                  ))}
                </div>
              ))}
          </section>
        ))}
        <div className="sticky-save">
          <button className="btn" type="submit" disabled={!dirty}>
            Enregistrer la page
          </button>{" "}
          <button className="btn btn--ghost" type="button" onClick={resetAll}>
            Tout rétablir
          </button>
        </div>
      </form>
    </>
  );
}
