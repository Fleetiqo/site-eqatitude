"use client";

import Link from "next/link";
import { useState, type DragEvent } from "react";
import { deleteMedia, replaceMedia } from "@/server/actions/content";
import type { MediaUsage } from "@/server/services/media";
import { Modal, useAdminUi } from "./AdminUi";
import { uploadImageFile } from "./images";
import { MediaPicker } from "./MediaPicker";

interface Media {
  url: string;
  uploaded: boolean;
  usages: MediaUsage[];
}

/** Replaces one image by another everywhere it is used on the site. */
function ReplaceDialog({ media, onClose }: { media: Media; onClose: () => void }) {
  const { run, toast } = useAdminUi();
  const [picking, setPicking] = useState(false);
  const [busy, setBusy] = useState(false);

  async function replaceWith(url: string) {
    const count = await run(replaceMedia(media.url, url));
    if (count !== undefined) {
      toast(`Image remplacée à ${count} endroit(s)`);
      onClose();
    }
  }

  return (
    <Modal onClose={onClose}>
      <h2>Remplacer cette image partout</h2>
      <p className="muted">La nouvelle image prendra sa place à chaque endroit où elle est utilisée :</p>
      <ul>
        {media.usages.map((u, i) => (
          <li key={i}>{u.label}</li>
        ))}
      </ul>
      <div className="actions">
        <label className="btn">
          {busy ? "Envoi…" : "Téléverser la nouvelle image"}
          <input
            type="file"
            accept="image/*"
            hidden
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              setBusy(true);
              const res = await uploadImageFile(file);
              setBusy(false);
              if (res.ok) replaceWith(res.data);
              else toast(res.error, true);
            }}
          />
        </label>
        <button className="btn btn--ghost" onClick={() => setPicking(true)}>
          Choisir dans la médiathèque
        </button>
        <button className="btn btn--ghost" onClick={onClose}>
          Annuler
        </button>
      </div>
      {picking && (
        <MediaPicker
          onClose={() => setPicking(false)}
          onPick={(url) => {
            setPicking(false);
            replaceWith(url);
          }}
        />
      )}
    </Modal>
  );
}

export function MediaLibrary({ media }: { media: Media[] }) {
  const { run, confirm, toast } = useAdminUi();
  const [filter, setFilter] = useState("");
  const [replacing, setReplacing] = useState<Media | null>(null);
  const [details, setDetails] = useState<Media | null>(null);

  const visible = media.filter((m) =>
    filter === "used"
      ? m.usages.length
      : filter === "unused"
        ? !m.usages.length
        : filter === "mine"
          ? m.uploaded
          : true,
  );

  async function upload(files: File[]) {
    let n = 0;
    for (const [i, f] of files.entries()) {
      toast(`Envoi ${i + 1}/${files.length}…`);
      const res = await uploadImageFile(f);
      if (res.ok) n++;
      else toast(`${f.name} : ${res.error}`, true);
    }
    toast(`${n} image(s) ajoutée(s)`);
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    upload([...e.dataTransfer.files].filter((f) => f.type.startsWith("image/")));
  };

  return (
    <div onDragOver={(e) => e.preventDefault()} onDrop={onDrop}>
      <div className="head-row">
        <h1>Médiathèque</h1>
        <label className="btn">
          Ajouter des images
          <input
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => {
              upload([...(e.target.files ?? [])]);
              e.target.value = "";
            }}
          />
        </label>
      </div>
      <p className="muted">
        Toutes les images du site. Les photos envoyées sont automatiquement redimensionnées (2000 px max.) pour un site
        rapide. Pour changer une photo du site, utilisez « Remplacer » : elle est mise à jour partout où elle apparaît.
      </p>
      <div className="filters">
        <select value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filtre">
          <option value="">Toutes</option>
          <option value="used">Utilisées sur le site</option>
          <option value="unused">Non utilisées</option>
          <option value="mine">Ajoutées depuis la console</option>
        </select>
      </div>
      <div className="media media--big">
        {visible.map((m) => (
          <figure key={m.url}>
            <img src={m.url} alt="" loading="lazy" />
            <figcaption>
              {m.usages.length ? (
                <button
                  type="button"
                  className="linklike ok"
                  onClick={() => setDetails(m)}
                  title="Voir où elle est utilisée"
                >
                  Utilisée ({m.usages.length})
                </button>
              ) : (
                <span className="muted">Non utilisée</span>
              )}
              <span className="actions">
                {m.usages.length > 0 && (
                  <button className="icon" title="Remplacer partout" onClick={() => setReplacing(m)}>
                    ⇄
                  </button>
                )}
                <button
                  className="icon"
                  title="Copier le lien"
                  onClick={() => navigator.clipboard.writeText(location.origin + m.url).then(() => toast("Lien copié"))}
                >
                  ⧉
                </button>
                <a className="icon" href={m.url} target="_blank" rel="noopener" title="Ouvrir">
                  ↗
                </a>
                {m.uploaded && (
                  <button
                    className="icon icon--danger"
                    title="Supprimer"
                    onClick={async () => {
                      const text = m.usages.length
                        ? "Cette image est utilisée sur le site. La supprimer quand même ?"
                        : "Supprimer cette image ?";
                      if (await confirm(text)) await run(deleteMedia(m.url), "Image supprimée");
                    }}
                  >
                    ✕
                  </button>
                )}
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
      {replacing && <ReplaceDialog media={replacing} onClose={() => setReplacing(null)} />}
      {details && (
        <Modal onClose={() => setDetails(null)}>
          <h2>Où cette image est utilisée</h2>
          <ul>
            {details.usages.map((u, i) => (
              <li key={i}>
                <Link href={u.href}>{u.label}</Link>
              </li>
            ))}
          </ul>
          <div className="actions">
            <button className="btn" onClick={() => (setReplacing(details), setDetails(null))}>
              Remplacer partout
            </button>
            <button className="btn btn--ghost" onClick={() => setDetails(null)}>
              Fermer
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
