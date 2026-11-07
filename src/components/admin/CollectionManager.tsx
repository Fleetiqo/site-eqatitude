"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import {
  COLLECTIONS,
  type AdminField,
  type CollectionItem,
  type CollectionSlug,
  type ItemValues,
} from "@/lib/admin-collections";
import { formatDateShort } from "@/lib/format";
import { deleteItem, reorderItems, saveItem } from "@/server/actions/content";
import { Modal, useAdminUi } from "./AdminUi";
import { ImageField } from "./ImageField";

// ---------------------------------------------------------------------------
// Per-collection presentation
// ---------------------------------------------------------------------------

const ok = (t: string) => <span className="ok">{t}</span>;
const off = (t: string) => <span className="off">{t}</span>;

function defaults(slug: CollectionSlug, today: string): ItemValues {
  switch (slug) {
    case "nouveautes":
      return { universe: "equitation", publishDate: today, published: true, featured: false };
    case "occasions":
      return { status: "dispo" };
    case "avis":
      return { rating: "5", published: true };
    case "fermetures":
      return { startDate: today };
    default:
      return {};
  }
}

function itemTitle(slug: CollectionSlug, it: CollectionItem): string {
  if (slug === "fermetures") {
    const from = String(it.startDate);
    const to = String(it.endDate || "");
    return to && to !== from ? `Du ${formatDateShort(from)} au ${formatDateShort(to)}` : `Le ${formatDateShort(from)}`;
  }
  return String(it[COLLECTIONS[slug].titleField] ?? "");
}

function itemSubtitle(slug: CollectionSlug, it: CollectionItem, today: string): ReactNode {
  switch (slug) {
    case "nouveautes":
      return (
        <>
          {it.universe === "amenagement" ? "Aménagement" : "Équitation"} · {formatDateShort(String(it.publishDate))} ·{" "}
          {!it.published ? off("brouillon") : String(it.publishDate) > today ? off("programmée") : ok("en ligne")}
          {it.featured ? <> · {ok("★ en avant")}</> : null}
        </>
      );
    case "occasions":
      return (
        <>
          {[it.brand, it.size, it.price && `${it.price} €`].filter(Boolean).join(" · ")} ·{" "}
          {it.status === "vendu" ? (
            <span className="muted">vendu</span>
          ) : it.status === "reserve" ? (
            off("réservé")
          ) : (
            ok("disponible")
          )}
        </>
      );
    case "avis":
      return (
        <>
          {String(it.text).slice(0, 90)}… · {it.published ? ok("affiché") : off("masqué")}
        </>
      );
    case "fermetures":
      return (
        <>
          {String(it.reason ?? "")}{" "}
          {String(it.endDate || it.startDate) < today ? <span className="muted">· passée</span> : ok("· à venir")}
        </>
      );
    default:
      return String(it.text ?? "").slice(0, 110);
  }
}

// ---------------------------------------------------------------------------
// Editor
// ---------------------------------------------------------------------------

function FieldInput({
  field,
  values,
  set,
}: {
  field: AdminField;
  values: ItemValues;
  set: (name: string, v: string | boolean) => void;
}) {
  const v = values[field.name];
  const str = typeof v === "string" ? v : "";
  const cls = field.half ? "half" : undefined;
  switch (field.type) {
    case "image":
      return <ImageField label={field.label} value={str} onChange={(url) => set(field.name, url)} />;
    case "textarea":
      return (
        <label>
          {field.label}
          <textarea
            rows={field.rows ?? 4}
            required={field.required}
            value={str}
            onChange={(e) => set(field.name, e.target.value)}
          />
        </label>
      );
    case "select":
      return (
        <label className={cls}>
          {field.label}
          <select value={str} onChange={(e) => set(field.name, e.target.value)}>
            {field.options?.map(([k, l]) => (
              <option key={k} value={k}>
                {l}
              </option>
            ))}
          </select>
        </label>
      );
    case "checkbox":
      return (
        <label className="check">
          <input type="checkbox" checked={v === true} onChange={(e) => set(field.name, e.target.checked)} />{" "}
          {field.label}
        </label>
      );
    default:
      return (
        <label className={cls}>
          {field.label}
          <input
            type={field.type}
            value={str}
            placeholder={field.placeholder}
            required={field.required}
            onChange={(e) => set(field.name, e.target.value)}
          />
        </label>
      );
  }
}

function ItemEditor({
  slug,
  item,
  onClose,
}: {
  slug: CollectionSlug;
  item: ItemValues & { id?: string };
  onClose: () => void;
}) {
  const def = COLLECTIONS[slug];
  const { run, toast } = useAdminUi();
  const { id, ...initial } = item;
  const [values, setValues] = useState<ItemValues>(() => {
    const v: ItemValues = {};
    for (const f of def.fields)
      v[f.name] =
        initial[f.name] ?? (f.type === "checkbox" ? false : f.type === "select" ? (f.options?.[0]?.[0] ?? "") : "");
    return v;
  });
  const set = (name: string, v: string | boolean) => setValues((prev) => ({ ...prev, [name]: v }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const missing = def.fields.find((f) => f.required && !values[f.name]);
    if (missing) return toast(`« ${missing.label} » est obligatoire.`, true);
    if ((await run(saveItem(slug, values, id), "Enregistré")) !== undefined) onClose();
  }

  return (
    <Modal onClose={onClose}>
      <form className="form" onSubmit={onSubmit}>
        <h2>
          {id ? "Modifier" : "Ajouter"} : {def.singular}
        </h2>
        <div className="form-grid">
          {def.fields.map((f) => (
            <FieldInput key={f.name} field={f} values={values} set={set} />
          ))}
        </div>
        <div className="actions">
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            Annuler
          </button>
          <button className="btn" type="submit">
            Enregistrer
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// List
// ---------------------------------------------------------------------------

export function CollectionManager({
  slug,
  items,
  today,
  openNew,
}: {
  slug: CollectionSlug;
  items: CollectionItem[];
  today: string;
  openNew: boolean;
}) {
  const def = COLLECTIONS[slug];
  const { run, confirm } = useAdminUi();
  const [editing, setEditing] = useState<(ItemValues & { id?: string }) | null>(() =>
    openNew ? defaults(slug, today) : null,
  );
  const [query, setQuery] = useState("");
  const hasImage = def.fields.some((f) => f.type === "image");
  const q = query.trim().toLowerCase();

  const save = (it: CollectionItem, patch: ItemValues, message: string) => {
    const { id, ...rest } = it;
    return run(saveItem(slug, { ...rest, ...patch }, id), message);
  };

  const move = (index: number, dir: -1 | 1) => {
    const ids = items.map((x) => x.id);
    const j = index + dir;
    [ids[index], ids[j]] = [ids[j]!, ids[index]!];
    return run(reorderItems(slug, ids));
  };

  return (
    <>
      <div className="head-row">
        <h1>{def.title}</h1>
        <div className="actions">
          <a className="btn btn--ghost" href={def.previewPath} target="_blank" rel="noopener">
            Voir sur le site ↗
          </a>
          <button className="btn" onClick={() => setEditing(defaults(slug, today))}>
            + Ajouter
          </button>
        </div>
      </div>
      <p className="muted">{def.intro}</p>
      {items.length > 6 && (
        <div className="filters">
          <input type="search" placeholder="Rechercher…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      )}
      <section className="panel">
        {items.length ? (
          <ul className={hasImage ? "items" : "items items--noimg"}>
            {items.map((it, i) => {
              const title = itemTitle(slug, it);
              const hidden =
                !!q && !Object.values(it).some((v) => typeof v === "string" && v.toLowerCase().includes(q));
              return (
                <li key={it.id} hidden={hidden}>
                  {hasImage && (
                    <div className="items__img">{it.image ? <img src={String(it.image)} alt="" /> : null}</div>
                  )}
                  <div className="items__body">
                    <b>{title}</b>
                    <small>{itemSubtitle(slug, it, today)}</small>
                  </div>
                  <div className="items__act">
                    {def.sortable && (
                      <>
                        <button className="icon" title="Monter" disabled={i === 0} onClick={() => move(i, -1)}>
                          ↑
                        </button>
                        <button
                          className="icon"
                          title="Descendre"
                          disabled={i === items.length - 1}
                          onClick={() => move(i, 1)}
                        >
                          ↓
                        </button>
                      </>
                    )}
                    {slug === "occasions" && (
                      <button
                        className="btn btn--ghost btn--sm"
                        onClick={() =>
                          save(
                            it,
                            { status: it.status === "vendu" ? "dispo" : "vendu" },
                            it.status === "vendu" ? "Remis en vente" : "Marqué comme vendu",
                          )
                        }
                      >
                        {it.status === "vendu" ? "Remettre en vente" : "Marquer vendu"}
                      </button>
                    )}
                    {(slug === "nouveautes" || slug === "avis") && (
                      <button
                        className="btn btn--ghost btn--sm"
                        onClick={() =>
                          save(it, { published: !it.published }, it.published ? "Masqué du site" : "Publié")
                        }
                      >
                        {it.published ? "Masquer" : "Publier"}
                      </button>
                    )}
                    <button className="btn btn--ghost btn--sm" onClick={() => setEditing(it)}>
                      Modifier
                    </button>
                    <button
                      className="icon"
                      title="Dupliquer"
                      onClick={() => {
                        const { id: _id, ...copy } = it;
                        if (typeof copy.title === "string") copy.title += " (copie)";
                        if (slug === "nouveautes") copy.published = false;
                        setEditing(copy);
                      }}
                    >
                      ⧉
                    </button>
                    <button
                      className="icon icon--danger"
                      title="Supprimer"
                      onClick={async () => {
                        if (await confirm(`Supprimer « ${title} » ?`))
                          await run(deleteItem(slug, it.id, title), "Supprimé");
                      }}
                    >
                      ✕
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="muted pad">Rien pour le moment. Cliquez sur « Ajouter ».</p>
        )}
      </section>
      {editing && (
        <ItemEditor
          slug={slug}
          item={editing}
          onClose={() => {
            setEditing(null);
            if (openNew) history.replaceState(null, "", location.pathname); // drop ?nouveau=1
          }}
        />
      )}
    </>
  );
}
