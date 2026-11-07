"use client";

import { useState, type DragEvent } from "react";
import type { GalleryPhoto, Universe } from "@/lib/types";
import { addToGallery, removeFromGallery, reorderGalleryPhotos, updateGallery } from "@/server/actions/content";
import { useAdminUi } from "./AdminUi";
import { uploadImageFile } from "./images";
import { MediaPicker } from "./MediaPicker";

export function GalleryManager({ photos, universe: initial }: { photos: GalleryPhoto[]; universe: Universe }) {
  const { run, confirm, toast } = useAdminUi();
  const [universe, setUniverse] = useState<Universe>(initial);
  const [picking, setPicking] = useState(false);
  const list = photos.filter((g) => g.universe === universe);

  const selectTab = (u: Universe) => {
    setUniverse(u);
    history.replaceState(null, "", `?univers=${u}`);
  };

  async function upload(files: File[]) {
    const urls: string[] = [];
    for (const [i, f] of files.entries()) {
      toast(`Envoi ${i + 1}/${files.length}…`);
      const res = await uploadImageFile(f);
      if (res.ok) urls.push(res.data);
      else toast(`${f.name} : ${res.error}`, true);
    }
    if (urls.length) await run(addToGallery(urls, universe), `${urls.length} photo(s) ajoutée(s)`);
  }

  const move = (id: string, dir: -1 | 1) => {
    const same = list.map((x) => x.id);
    const i = same.indexOf(id);
    const j = i + dir;
    if (j < 0 || j >= same.length) return;
    [same[i], same[j]] = [same[j]!, same[i]!];
    const others = photos.filter((x) => x.universe !== universe).map((x) => x.id);
    return run(reorderGalleryPhotos([...same, ...others]));
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    upload([...e.dataTransfer.files].filter((f) => f.type.startsWith("image/")));
  };

  return (
    <div onDragOver={(e) => e.preventDefault()} onDrop={onDrop}>
      <div className="head-row">
        <h1>Galerie photos</h1>
        <div className="actions">
          <button className="btn btn--ghost" onClick={() => setPicking(true)}>
            Depuis la médiathèque
          </button>
          <label className="btn">
            Ajouter des photos
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
      </div>
      <p className="muted">
        Photos « Aménagement » = réalisations sur la page Clôtures &amp; aménagement ; photos « Équitation » = page
        Équitation. Les ajouts vont dans l&apos;onglet affiché. Glisser-déposer accepté.
      </p>
      <div className="tabs">
        <button
          className={universe === "amenagement" ? "is-active" : undefined}
          onClick={() => selectTab("amenagement")}
        >
          Aménagement
        </button>
        <button className={universe === "equitation" ? "is-active" : undefined} onClick={() => selectTab("equitation")}>
          Équitation
        </button>
      </div>
      <div className="gal">
        {list.length ? (
          list.map((g) => (
            <figure key={g.id}>
              <img src={g.src} alt="" loading="lazy" />
              <figcaption>
                <input
                  defaultValue={g.caption}
                  placeholder="Légende"
                  onBlur={(e) => {
                    const caption = e.target.value.trim();
                    if (caption !== g.caption) run(updateGallery(g.id, { caption }), "Légende enregistrée");
                  }}
                />
                <div className="gal__act">
                  <button className="icon" title="Avancer" onClick={() => move(g.id, -1)}>
                    ←
                  </button>
                  <button className="icon" title="Reculer" onClick={() => move(g.id, 1)}>
                    →
                  </button>
                  <button
                    className="icon"
                    title="Changer d'univers"
                    onClick={() =>
                      run(
                        updateGallery(g.id, { universe: g.universe === "equitation" ? "amenagement" : "equitation" }),
                        "Photo déplacée",
                      )
                    }
                  >
                    ⇄
                  </button>
                  <button
                    className="icon icon--danger"
                    title="Retirer"
                    onClick={async () => {
                      if (
                        await confirm("Retirer cette photo de la galerie ? (elle reste dans la médiathèque)", "Retirer")
                      )
                        await run(removeFromGallery(g.id));
                    }}
                  >
                    ✕
                  </button>
                </div>
              </figcaption>
            </figure>
          ))
        ) : (
          <p className="muted">Aucune photo dans cet onglet.</p>
        )}
      </div>
      {picking && (
        <MediaPicker
          onClose={() => setPicking(false)}
          onPick={(url) => {
            setPicking(false);
            run(addToGallery([url], universe), "1 photo ajoutée");
          }}
        />
      )}
    </div>
  );
}
