"use client";

import { useEffect, useState } from "react";
import { getMediaLibrary } from "@/server/actions/content";
import { Modal, useAdminUi } from "./AdminUi";

/** Lets the user choose an image already on the site. */
export function MediaPicker({ onPick, onClose }: { onPick: (url: string) => void; onClose: () => void }) {
  const { run } = useAdminUi();
  const [media, setMedia] = useState<string[] | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    run(getMediaLibrary()).then((list) => setMedia(list?.map((m) => m.url) ?? []));
  }, [run]);

  const visible = (media ?? []).filter((u) => u.toLowerCase().includes(query.toLowerCase()));

  return (
    <Modal onClose={onClose} wide>
      <div className="head-row">
        <h2>Médiathèque</h2>
        <div className="actions">
          <input
            type="search"
            placeholder="Filtrer…"
            className="input-sm"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button className="btn btn--ghost btn--sm" onClick={onClose}>
            Fermer
          </button>
        </div>
      </div>
      {media === null ? (
        <p className="muted">Chargement…</p>
      ) : (
        <div className="media">
          {visible.map((u) => (
            <button type="button" key={u} onClick={() => onPick(u)}>
              <img src={u} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </Modal>
  );
}
