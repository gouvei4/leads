"use client";

import { useState } from "react";
import { useProjeto } from "./ProjetoContext";
import { PlusIcon, PencilIcon, TrashIcon, CheckIcon, XIcon } from "../icons";

type Modo = "ver" | "novo" | "renomear";

export default function ProjetoBar() {
  const { projetos, projetoId, projetoAtual, carregando, selecionar, criar, renomear, excluir } = useProjeto();
  const [modo, setModo] = useState<Modo>("ver");
  const [rascunho, setRascunho] = useState("");
  const [ocupado, setOcupado] = useState(false);

  function abrirNovo() {
    setRascunho("");
    setModo("novo");
  }
  function abrirRenomear() {
    setRascunho(projetoAtual?.nome ?? "");
    setModo("renomear");
  }

  async function confirmar() {
    const nome = rascunho.trim();
    if (!nome) return;
    setOcupado(true);
    try {
      if (modo === "novo") await criar(nome);
      else if (modo === "renomear" && projetoAtual) await renomear(projetoAtual.id, nome);
      setModo("ver");
    } finally {
      setOcupado(false);
    }
  }

  async function apagar() {
    if (!projetoAtual) return;
    if (!confirm(`Excluir o projeto "${projetoAtual.nome}"? Os leads ficam sem projeto, mas não são apagados.`)) return;
    await excluir(projetoAtual.id);
  }

  if (carregando) {
    return <div className="h-[52px] shrink-0 border-b border-line" />;
  }

  return (
    <div className="shrink-0 border-b border-line px-3 py-2">
      <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-ink-muted">Projeto</span>
      {modo === "ver" ? (
        <div className="flex items-center gap-1">
          {projetos.length > 0 ? (
            <select
              value={projetoId}
              onChange={(e) => selecionar(e.target.value)}
              aria-label="Selecionar projeto"
              className="min-w-0 flex-1 rounded-control border border-line bg-surface-2 px-2 py-1.5 text-sm text-ink focus:border-primary focus:outline-none"
            >
              {projetos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </select>
          ) : (
            <span className="flex-1 text-xs text-ink-muted">Nenhum projeto ainda</span>
          )}
          {projetoAtual && (
            <>
              <button
                type="button"
                onClick={abrirRenomear}
                title="Renomear projeto"
                aria-label="Renomear projeto"
                className="shrink-0 rounded-control p-1.5 text-ink-muted hover:bg-surface-2 hover:text-ink"
              >
                <PencilIcon className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={apagar}
                title="Excluir projeto"
                aria-label="Excluir projeto"
                className="shrink-0 rounded-control p-1.5 text-ink-muted hover:bg-status-recusado/10 hover:text-status-recusado"
              >
                <TrashIcon className="h-3.5 w-3.5" />
              </button>
            </>
          )}
          <button
            type="button"
            onClick={abrirNovo}
            title="Novo projeto"
            aria-label="Novo projeto"
            className="shrink-0 rounded-control p-1.5 text-ink-muted hover:bg-surface-2 hover:text-ink"
          >
            <PlusIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-1">
          <input
            autoFocus
            value={rascunho}
            onChange={(e) => setRascunho(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") confirmar();
              if (e.key === "Escape") setModo("ver");
            }}
            placeholder={modo === "novo" ? "Nome do novo projeto" : "Novo nome"}
            className="min-w-0 flex-1 rounded-control border border-line bg-surface-2 px-2 py-1.5 text-sm text-ink focus:border-primary focus:outline-none"
          />
          <button
            type="button"
            onClick={confirmar}
            disabled={ocupado || !rascunho.trim()}
            aria-label="Confirmar"
            className="shrink-0 rounded-control p-1.5 text-status-cliente hover:bg-status-cliente/10 disabled:opacity-40"
          >
            <CheckIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setModo("ver")}
            aria-label="Cancelar"
            className="shrink-0 rounded-control p-1.5 text-ink-muted hover:bg-surface-2 hover:text-ink"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
