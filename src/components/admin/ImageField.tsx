"use client";

import { useState, type DragEvent } from "react";
import { useAdminUi } from "./AdminUi";
import { uploadImageFile } from "./images";
import { MediaPicker } from "./MediaPicker";

interface Props {
  label: string;
  value: string;
  onChange: (url: string) => void;
  help?: string;
  /** Shown as "Image d'origine" with a reset button when different from the value. */
  defaultValue?: string;
}

/** Image input: upload (drag & drop or file picker), choose from the library, remove. */
export function ImageField({ label, value, onChange, help, defaultValue }: Props) {
  const { run } = useAdminUi();
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const [picking, setPicking] = useState(false);

  async function send(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    const url = await run(uploadImageFile(file));
    setBusy(false);
    if (url) onChange(url);
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDrag(false);
    send(e.dataTransfer.files[0]);
  };

  return (
    <div className="imgfield">
      <span className="lbl">{label}</span>
      <div
        className={drag ? "imgfield__preview is-drag" : "imgfield__preview"}
        title="Glissez une image ici"
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
      >
        {busy ? (
          <span>Envoi…</span>
        ) : value ? (
          <img src={value} alt="" />
        ) : (
          <span>Aucune image — glissez une photo ici</span>
        )}
      </div>
      {help && <small className="muted">{help}</small>}
      <div className="imgfield__btns">
        <label className="btn btn--ghost btn--sm">
          Téléverser
          <input
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              send(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </label>
        <button type="button" className="btn btn--ghost btn--sm" onClick={() => setPicking(true)}>
          Médiathèque
        </button>
        <button type="button" className="btn btn--ghost btn--sm" onClick={() => onChange("")}>
          Retirer
        </button>
        {defaultValue !== undefined && value !== defaultValue && (
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => onChange(defaultValue)}>
            Image d&apos;origine
          </button>
        )}
      </div>
      {picking && (
        <MediaPicker
          onClose={() => setPicking(false)}
          onPick={(url) => {
            setPicking(false);
            onChange(url);
          }}
        />
      )}
    </div>
  );
}
