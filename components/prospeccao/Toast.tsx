"use client";

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { XIcon } from "../icons";

interface ToastAcao {
  label: string;
  onClick: () => void;
}

interface ToastItem {
  id: number;
  mensagem: string;
  acao?: ToastAcao;
}

interface ToastContextValue {
  mostrarToast: (mensagem: string, acao?: ToastAcao) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast precisa estar dentro de <ToastProvider>");
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const fechar = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const mostrarToast = useCallback(
    (mensagem: string, acao?: ToastAcao) => {
      const id = ++idRef.current;
      setToasts((prev) => [...prev, { id, mensagem, acao }]);
      setTimeout(() => fechar(id), 6000);
    },
    [fechar]
  );

  return (
    <ToastContext.Provider value={{ mostrarToast }}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[1000] flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className="pointer-events-auto flex items-center gap-3 rounded-control border border-line bg-surface px-4 py-3 text-sm text-ink shadow-2xl"
          >
            <span>{t.mensagem}</span>
            {t.acao && (
              <button
                type="button"
                onClick={() => {
                  t.acao!.onClick();
                  fechar(t.id);
                }}
                className="shrink-0 rounded-control bg-primary px-2.5 py-1 text-xs font-semibold text-white hover:bg-primary-hover"
              >
                {t.acao.label}
              </button>
            )}
            <button
              type="button"
              onClick={() => fechar(t.id)}
              aria-label="Fechar aviso"
              className="shrink-0 text-ink-muted hover:text-ink"
            >
              <XIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
