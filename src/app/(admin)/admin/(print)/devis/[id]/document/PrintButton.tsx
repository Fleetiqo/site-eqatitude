"use client";

export function PrintButton({ className }: { className?: string }) {
  return (
    <div className={className}>
      <button onClick={() => print()}>Imprimer / Enregistrer en PDF</button>
    </div>
  );
}
