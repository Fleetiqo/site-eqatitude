"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { ActionResult } from "@/server/actions/run";

interface Confirm {
  text: string;
  okLabel: string;
  danger: boolean;
  resolve: (ok: boolean) => void;
}

interface AdminUi {
  toast: (text: string, isError?: boolean) => void;
  confirm: (text: string, okLabel?: string, danger?: boolean) => Promise<boolean>;
  /** Runs a server action; shows its error as a toast and returns the data (undefined on error). */
  run: <T>(action: Promise<ActionResult<T>>, success?: string) => Promise<T | undefined>;
}

const Ctx = createContext<AdminUi | null>(null);

export function useAdminUi(): AdminUi {
  const ui = useContext(Ctx);
  if (!ui) throw new Error("useAdminUi must be used inside <AdminUiProvider>");
  return ui;
}

/** Toasts and confirmation dialogs shared by every admin page. */
export function AdminUiProvider({ children }: { children: ReactNode }) {
  const [toastState, setToast] = useState<{ text: string; error: boolean } | null>(null);
  const [confirmState, setConfirm] = useState<Confirm | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const toast = useCallback((text: string, isError = false) => {
    setToast({ text, error: isError });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), 3200);
  }, []);

  const confirm = useCallback(
    (text: string, okLabel = "Supprimer", danger = true) =>
      new Promise<boolean>((resolve) => setConfirm({ text, okLabel, danger, resolve })),
    [],
  );

  const run = useCallback(
    async <T,>(action: Promise<ActionResult<T>>, success?: string) => {
      try {
        const res = await action;
        if (!res.ok) {
          toast(res.error, true);
          return undefined;
        }
        if (success) toast(success);
        return res.data;
      } catch {
        // Expired sessions are redirected to the login page by Next.js; anything else is unexpected.
        toast("Une erreur est survenue. Réessayez.", true);
        return undefined;
      }
    },
    [toast],
  );

  const answer = (ok: boolean) => {
    confirmState?.resolve(ok);
    setConfirm(null);
  };

  return (
    <Ctx.Provider value={{ toast, confirm, run }}>
      {children}
      {confirmState && (
        <Modal onClose={() => answer(false)}>
          <p className="confirm-text">{confirmState.text}</p>
          <div className="actions">
            <button className="btn btn--ghost" onClick={() => answer(false)}>
              Annuler
            </button>
            <button className={confirmState.danger ? "btn btn--danger" : "btn"} onClick={() => answer(true)} autoFocus>
              {confirmState.okLabel}
            </button>
          </div>
        </Modal>
      )}
      <div className={toastState?.error ? "toast is-error" : "toast"} role="status" hidden={!toastState}>
        {toastState?.text}
      </div>
    </Ctx.Provider>
  );
}

/** Modal dialog: closes on Escape or a click on the backdrop. */
export function Modal({
  children,
  onClose,
  wide = false,
}: {
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  useEffect(() => {
    document.body.classList.add("no-scroll");
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    addEventListener("keydown", onKey);
    return () => {
      removeEventListener("keydown", onKey);
      document.body.classList.remove("no-scroll");
    };
  }, [onClose]);
  return (
    <div className="modal" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={wide ? "modal__box modal__box--wide" : "modal__box"} role="dialog" aria-modal="true">
        {children}
      </div>
    </div>
  );
}
