"use client";

import { useEffect } from "react";
import { XIcon } from "../icons";

const ATALHOS: { tecla: string; desc: string }[] = [
  { tecla: "?", desc: "Abre/fecha esta ajuda" },
  { tecla: "/", desc: "Foca a busca por nome nos resultados" },
  { tecla: "j / k", desc: "Próximo / anterior lead da lista" },
  { tecla: "c", desc: "Copia a mensagem do lead em foco" },
  { tecla: "1 – 6", desc: "Muda o status do lead em foco (Novo → Recusado)" },
  { tecla: "Esc", desc: "Fecha o modal aberto" },
];

export default function AtalhosModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Atalhos de teclado"
        className="w-full max-w-sm rounded-card border border-line bg-surface p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-ink">Atalhos de teclado</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="rounded-control p-1.5 text-ink-muted hover:bg-surface-2 hover:text-ink"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>
        <ul className="mt-4 space-y-2">
          {ATALHOS.map((a) => (
            <li key={a.tecla} className="flex items-center justify-between gap-4 text-sm">
              <span className="text-ink-muted">{a.desc}</span>
              <kbd className="shrink-0 rounded border border-line bg-surface-2 px-1.5 py-0.5 font-mono text-xs text-ink">
                {a.tecla}
              </kbd>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
