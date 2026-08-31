"use client";

import { STATUS_OPTIONS, STATUS_COLORS, type SiteQualidade, type Busca } from "@/lib/types";
import { XIcon } from "../icons";

const QUALIDADES: { id: SiteQualidade; label: string }[] = [
  { id: "ausente", label: "Sem site" },
  { id: "fraca", label: "Site fraco" },
  { id: "ok", label: "Site OK" },
];

export interface FiltrosAvancados {
  status: Set<string>;
  scoreMin: number;
  siteQualidade: Set<SiteQualidade>;
  desde: string;
}

export function filtrosVazios(): FiltrosAvancados {
  return { status: new Set(), scoreMin: 0, siteQualidade: new Set(), desde: "" };
}

export default function FiltrosPanel({
  filtros,
  onChange,
  buscas,
  buscaIdFiltro,
  onSelecionarBusca,
  mostrarCobertura,
  onToggleCobertura,
  onFechar,
}: {
  filtros: FiltrosAvancados;
  onChange: (patch: Partial<FiltrosAvancados>) => void;
  buscas: Busca[];
  buscaIdFiltro: string | null;
  onSelecionarBusca: (id: string | null) => void;
  mostrarCobertura: boolean;
  onToggleCobertura: () => void;
  onFechar: () => void;
}) {
  function toggleStatus(s: string) {
    const next = new Set(filtros.status);
    if (next.has(s)) next.delete(s);
    else next.add(s);
    onChange({ status: next });
  }

  function toggleQualidade(q: SiteQualidade) {
    const next = new Set(filtros.siteQualidade);
    if (next.has(q)) next.delete(q);
    else next.add(q);
    onChange({ siteQualidade: next });
  }

  return (
    <div className="absolute left-0 top-full z-30 mt-1.5 w-80 space-y-4 rounded-control border border-line bg-surface p-4 shadow-2xl">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-ink">Filtros avançados</span>
        <button type="button" onClick={onFechar} aria-label="Fechar filtros" className="text-ink-muted hover:text-ink">
          <XIcon className="h-4 w-4" />
        </button>
      </div>

      <div>
        <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-muted">Status</div>
        <div className="flex flex-wrap gap-1.5">
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => toggleStatus(s)}
              aria-pressed={filtros.status.has(s)}
              className="rounded-full border px-2 py-1 text-[11px] font-medium transition-colors"
              style={
                filtros.status.has(s)
                  ? { borderColor: STATUS_COLORS[s], backgroundColor: `${STATUS_COLORS[s]}1A`, color: STATUS_COLORS[s] }
                  : { borderColor: "var(--color-line)", color: "var(--color-ink-muted)" }
              }
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-ink-muted">
          <span>Score mínimo</span>
          <span className="text-primary">{filtros.scoreMin}</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={filtros.scoreMin}
          onChange={(e) => onChange({ scoreMin: Number(e.target.value) })}
          className="w-full accent-primary"
        />
      </div>

      <div>
        <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-muted">Qualidade do site</div>
        <div className="flex flex-wrap gap-1.5">
          {QUALIDADES.map((q) => (
            <button
              key={q.id}
              type="button"
              onClick={() => toggleQualidade(q.id)}
              aria-pressed={filtros.siteQualidade.has(q.id)}
              className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                filtros.siteQualidade.has(q.id)
                  ? "border-primary bg-primary/15 text-primary"
                  : "border-line text-ink-muted hover:border-line-strong hover:text-ink"
              }`}
            >
              {q.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="filtro-desde" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-muted">
          Última interação desde
        </label>
        <input
          id="filtro-desde"
          type="date"
          value={filtros.desde}
          onChange={(e) => onChange({ desde: e.target.value })}
          className="w-full rounded-control border border-line bg-surface-2 px-2.5 py-1.5 text-xs text-ink focus:border-primary focus:outline-none"
        />
      </div>

      {buscas.length > 0 && (
        <div>
          <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-muted">Buscas anteriores</div>
          <select
            value={buscaIdFiltro ?? ""}
            onChange={(e) => onSelecionarBusca(e.target.value || null)}
            className="w-full rounded-control border border-line bg-surface-2 px-2.5 py-1.5 text-xs text-ink focus:border-primary focus:outline-none"
          >
            <option value="">Todas as buscas</option>
            {buscas.map((b) => (
              <option key={b.id} value={b.id}>
                {b.nicho} · {b.localizacao_texto || "—"} · {(b.raio_m / 1000).toFixed(0)}km ·{" "}
                {new Date(b.criado_em).toLocaleDateString("pt-BR")}
              </option>
            ))}
          </select>
          <label className="mt-2 flex items-center gap-2 text-xs text-ink-muted">
            <input type="checkbox" checked={mostrarCobertura} onChange={onToggleCobertura} className="accent-primary" />
            Mostrar área coberta no mapa
          </label>
        </div>
      )}

      <button
        type="button"
        onClick={() => {
          onChange(filtrosVazios());
          onSelecionarBusca(null);
        }}
        className="w-full rounded-control border border-line px-3 py-1.5 text-xs font-medium text-ink-muted hover:bg-surface-2 hover:text-ink"
      >
        Limpar filtros
      </button>
    </div>
  );
}
