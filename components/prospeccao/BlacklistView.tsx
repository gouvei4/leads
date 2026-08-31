"use client";

import { useEffect, useState } from "react";
import type { BlacklistEntry, BlacklistTipo } from "@/lib/types";
import { PlusIcon, TrashIcon, ShieldOffIcon } from "../icons";

export default function BlacklistView() {
  const [itens, setItens] = useState<BlacklistEntry[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [tipo, setTipo] = useState<BlacklistTipo>("telefone");
  const [valor, setValor] = useState("");
  const [motivo, setMotivo] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function carregar() {
    setCarregando(true);
    setErro(null);
    try {
      const r = await fetch("/api/blacklist");
      const d = await r.json();
      if (!r.ok) throw new Error(d.erro || "Erro ao carregar blacklist");
      setItens(d.itens ?? []);
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carrega a blacklist ao montar
    carregar();
  }, []);

  async function adicionar() {
    if (!valor.trim()) return;
    setSalvando(true);
    setErro(null);
    try {
      const r = await fetch("/api/blacklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo, valor, motivo: motivo.trim() || "Bloqueado manualmente" }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.erro || "Erro ao bloquear");
      setValor("");
      setMotivo("");
      await carregar();
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setSalvando(false);
    }
  }

  async function remover(id: string) {
    setItens((prev) => prev.filter((i) => i.id !== id));
    await fetch(`/api/blacklist/${id}`, { method: "DELETE" });
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h2 className="text-lg font-bold text-ink">Blacklist</h2>
      <p className="mt-1 text-sm text-ink-muted">
        Telefones e CNPJs bloqueados nunca reaparecem em buscas futuras, em nenhum projeto. Leads marcados como
        &quot;Recusado&quot; entram aqui automaticamente.
      </p>

      <div className="mt-5 flex flex-wrap items-end gap-2 rounded-card border border-line bg-surface p-4">
        <div>
          <label htmlFor="bl-tipo" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Tipo
          </label>
          <select
            id="bl-tipo"
            value={tipo}
            onChange={(e) => setTipo(e.target.value as BlacklistTipo)}
            className="rounded-control border border-line bg-surface-2 px-3 py-2 text-sm text-ink focus:border-primary focus:outline-none"
          >
            <option value="telefone">Telefone</option>
            <option value="cnpj">CNPJ</option>
          </select>
        </div>
        <div className="min-w-[200px] flex-1">
          <label htmlFor="bl-valor" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-muted">
            {tipo === "telefone" ? "Telefone" : "CNPJ"}
          </label>
          <input
            id="bl-valor"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            placeholder={tipo === "telefone" ? "(11) 91234-5678" : "00.000.000/0000-00"}
            className="w-full rounded-control border border-line bg-surface-2 px-3 py-2 text-sm text-ink focus:border-primary focus:outline-none"
          />
        </div>
        <div className="min-w-[200px] flex-1">
          <label htmlFor="bl-motivo" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Motivo (opcional)
          </label>
          <input
            id="bl-motivo"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Ex: pediu pra não contatar"
            className="w-full rounded-control border border-line bg-surface-2 px-3 py-2 text-sm text-ink focus:border-primary focus:outline-none"
          />
        </div>
        <button
          type="button"
          onClick={adicionar}
          disabled={salvando || !valor.trim()}
          className="inline-flex items-center gap-1.5 rounded-control bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          <PlusIcon className="h-4 w-4" /> Bloquear
        </button>
      </div>

      {erro && <p className="mt-3 text-xs text-status-recusado">{erro}</p>}

      <div className="mt-5">
        {carregando ? (
          <p className="text-sm text-ink-muted">Carregando...</p>
        ) : itens.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-14 text-center">
            <ShieldOffIcon className="h-7 w-7 text-ink-muted/60" />
            <p className="text-sm font-semibold text-ink">Nenhum bloqueio ainda</p>
            <p className="text-xs text-ink-muted">Telefones/CNPJs bloqueados aparecem aqui.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {itens.map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-3 rounded-control border border-line bg-surface px-3 py-2.5"
              >
                <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-semibold uppercase text-ink-muted">
                  {item.tipo}
                </span>
                <span className="font-mono text-sm text-ink">{item.valor}</span>
                <span className="flex-1 truncate text-xs text-ink-muted">{item.motivo}</span>
                <span className="shrink-0 text-xs text-ink-muted">
                  {new Date(item.criado_em).toLocaleDateString("pt-BR")}
                </span>
                <button
                  type="button"
                  onClick={() => remover(item.id)}
                  aria-label="Remover da blacklist"
                  title="Remover da blacklist"
                  className="shrink-0 rounded-control p-1.5 text-ink-muted hover:bg-status-recusado/10 hover:text-status-recusado"
                >
                  <TrashIcon className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
