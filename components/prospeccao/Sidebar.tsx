"use client";

import { useState } from "react";
import type { Busca, HistoricoEvento, Lead } from "@/lib/types";
import type { SugestaoLocalizacao } from "@/lib/places";
import { montarBlocoMensagensLote } from "@/lib/mensagemTemplate";
import { NICHOS_SUGERIDOS } from "@/lib/nichos";
import LeadCard, { LeadCardSkeleton } from "./LeadCard";
import FiltrosPanel, { type FiltrosAvancados } from "./FiltrosPanel";
import type { Canal } from "./ChannelChips";
import {
  SearchIcon,
  MapPinIcon,
  KanbanIcon,
  GaugeIcon,
  DownloadIcon,
  SortIcon,
  FilterIcon,
  InboxIcon,
  CopyIcon,
  XIcon,
  ClockIcon,
} from "../icons";

export type ViewId = "mapa" | "kanban" | "painel";
export type SortOption = "score" | "nome" | "recente";

export interface UltimaBusca {
  total_no_raio: number;
  sem_site: number;
  enriquecidos: number;
  novos: number;
  duplicados: number;
}

const CANAIS: { id: Canal; label: string }[] = [
  { id: "whatsapp", label: "WhatsApp" },
  { id: "instagram", label: "Instagram" },
  { id: "email", label: "E-mail" },
];

const VIEWS: { id: ViewId; label: string; Icon: typeof MapPinIcon }[] = [
  { id: "mapa", label: "Mapa", Icon: MapPinIcon },
  { id: "kanban", label: "Kanban", Icon: KanbanIcon },
  { id: "painel", label: "Painel", Icon: GaugeIcon },
];

export default function Sidebar({
  nicho,
  onNichoChange,
  localizacaoTexto,
  onLocalizacaoTextoChange,
  sugestoes,
  onSelecionarSugestao,
  mostrarSugestoes,
  raioKm,
  onRaioKmChange,
  buscando,
  onBuscar,
  buscaDesabilitada,
  erroBusca,
  ultimaBusca,
  view,
  onViewChange,
  leads,
  loadingLeads,
  leadSelecionadoId,
  onSelecionarLead,
  sort,
  onSortChange,
  canaisFiltro,
  onToggleCanalFiltro,
  onExportar,
  selecaoLote,
  onToggleLote,
  onLimparLote,
  onAtualizarLead,
  onAposAcaoMensagem,
  apenasRetomar,
  onToggleApenasRetomar,
  buscaTextual,
  onBuscaTextualChange,
  filtrosAvancados,
  onFiltrosAvancadosChange,
  buscas,
  buscaIdFiltro,
  onSelecionarBusca,
  mostrarCobertura,
  onToggleCobertura,
}: {
  nicho: string;
  onNichoChange: (v: string) => void;
  localizacaoTexto: string;
  onLocalizacaoTextoChange: (v: string) => void;
  sugestoes: SugestaoLocalizacao[];
  onSelecionarSugestao: (s: SugestaoLocalizacao) => void;
  mostrarSugestoes: boolean;
  raioKm: number;
  onRaioKmChange: (v: number) => void;
  buscando: boolean;
  onBuscar: () => void;
  buscaDesabilitada: boolean;
  erroBusca: string | null;
  ultimaBusca: UltimaBusca | null;
  view: ViewId;
  onViewChange: (v: ViewId) => void;
  leads: Lead[];
  loadingLeads: boolean;
  leadSelecionadoId: string | null;
  onSelecionarLead: (lead: Lead) => void;
  sort: SortOption;
  onSortChange: (v: SortOption) => void;
  canaisFiltro: Set<Canal>;
  onToggleCanalFiltro: (c: Canal) => void;
  onExportar: (formato: "xlsx" | "csv") => void;
  selecaoLote: Set<string>;
  onToggleLote: (id: string) => void;
  onLimparLote: () => void;
  onAtualizarLead: (id: string, updates: Partial<Lead>, evento?: HistoricoEvento) => void;
  onAposAcaoMensagem: (lead: Lead, tipo: "mensagem_copiada" | "whatsapp_aberto") => void;
  apenasRetomar: boolean;
  onToggleApenasRetomar: () => void;
  buscaTextual: string;
  onBuscaTextualChange: (v: string) => void;
  filtrosAvancados: FiltrosAvancados;
  onFiltrosAvancadosChange: (patch: Partial<FiltrosAvancados>) => void;
  buscas: Busca[];
  buscaIdFiltro: string | null;
  onSelecionarBusca: (id: string | null) => void;
  mostrarCobertura: boolean;
  onToggleCobertura: () => void;
}) {
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);
  const leadsSelecionados = leads.filter((l) => selecaoLote.has(l.id));
  const filtrosAtivos =
    filtrosAvancados.status.size > 0 ||
    filtrosAvancados.scoreMin > 0 ||
    filtrosAvancados.siteQualidade.size > 0 ||
    Boolean(filtrosAvancados.desde) ||
    Boolean(buscaIdFiltro);
  const algumFiltroAtivo =
    filtrosAtivos || canaisFiltro.size > 0 || apenasRetomar || Boolean(buscaTextual.trim());

  async function copiarMensagensLote() {
    const bloco = montarBlocoMensagensLote(leadsSelecionados);
    try {
      await navigator.clipboard.writeText(bloco);
    } catch {
      alert(`Não foi possível copiar automaticamente. Copie manualmente:\n\n${bloco}`);
    }
  }
  return (
    <aside className="flex h-full w-[400px] shrink-0 flex-col border-r border-line bg-surface">
      <div className="shrink-0 space-y-4 border-b border-line p-4">
        <div>
          <label htmlFor="nicho" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Nicho
          </label>
          <input
            id="nicho"
            list="nichos-sugeridos"
            value={nicho}
            onChange={(e) => onNichoChange(e.target.value)}
            placeholder="Ex: clínica odontológica"
            className="w-full rounded-control border border-line bg-surface-2 px-3 py-2 text-sm text-ink placeholder:text-ink-muted/60 focus:border-primary focus:outline-none"
          />
          <datalist id="nichos-sugeridos">
            {NICHOS_SUGERIDOS.map((n) => (
              <option key={n} value={n} />
            ))}
          </datalist>
        </div>

        <div className="relative">
          <label htmlFor="localizacao" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Localização
          </label>
          <input
            id="localizacao"
            value={localizacaoTexto}
            onChange={(e) => onLocalizacaoTextoChange(e.target.value)}
            placeholder="Cidade, bairro ou endereço"
            autoComplete="off"
            className="w-full rounded-control border border-line bg-surface-2 px-3 py-2 text-sm text-ink placeholder:text-ink-muted/60 focus:border-primary focus:outline-none"
          />
          {mostrarSugestoes && sugestoes.length > 0 && (
            <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-control border border-line bg-surface shadow-xl">
              {sugestoes.map((s) => (
                <li key={s.placeId}>
                  <button
                    type="button"
                    onClick={() => onSelecionarSugestao(s)}
                    className="block w-full truncate px-3 py-2 text-left text-sm text-ink hover:bg-surface-2"
                  >
                    {s.texto}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="raio" className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
              Raio de busca
            </label>
            <span className="text-xs font-semibold tabular-nums text-primary">{raioKm} km</span>
          </div>
          <input
            id="raio"
            type="range"
            min={1}
            max={500}
            step={1}
            value={raioKm}
            onChange={(e) => onRaioKmChange(Number(e.target.value))}
            className="w-full accent-primary"
          />
        </div>

        <button
          type="button"
          onClick={onBuscar}
          disabled={buscaDesabilitada || buscando}
          className="flex w-full items-center justify-center gap-2 rounded-control bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          <SearchIcon className={`h-4 w-4 ${buscando ? "animate-spin" : ""}`} />
          {buscando ? "Buscando..." : "Buscar leads"}
        </button>

        {erroBusca && <p className="text-xs text-status-recusado">{erroBusca}</p>}

        {ultimaBusca && (
          <div className="rounded-control border border-line bg-surface-2 px-3 py-2 text-xs text-ink-muted">
            <span className="font-semibold tabular-nums text-ink">{ultimaBusca.sem_site}</span> sem site de{" "}
            <span className="font-semibold tabular-nums text-ink">{ultimaBusca.total_no_raio}</span> no raio ·{" "}
            <span className="font-semibold tabular-nums text-ink">{ultimaBusca.enriquecidos}</span> enriquecidos
          </div>
        )}
      </div>

      <div className="grid shrink-0 grid-cols-3 gap-1 border-b border-line p-2">
        {VIEWS.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => onViewChange(id)}
            aria-pressed={view === id}
            className={`flex flex-col items-center gap-1 rounded-control px-2 py-2 text-[11px] font-medium transition-colors ${
              view === id ? "bg-primary/15 text-primary" : "text-ink-muted hover:bg-surface-2 hover:text-ink"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      <div className="relative shrink-0 border-b border-line p-3">
        <div className="relative mb-2">
          <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-muted" />
          <input
            id="busca-textual-input"
            value={buscaTextual}
            onChange={(e) => onBuscaTextualChange(e.target.value)}
            placeholder="Buscar por nome nos resultados... (/)"
            className="w-full rounded-control border border-line bg-surface-2 py-1.5 pl-8 pr-2 text-xs text-ink placeholder:text-ink-muted/60 focus:border-primary focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setFiltrosAbertos((v) => !v)}
          aria-pressed={filtrosAbertos || filtrosAtivos}
          className={`inline-flex items-center gap-1 rounded-control border p-1.5 transition-colors ${
            filtrosAtivos
              ? "border-primary bg-primary/15 text-primary"
              : "border-transparent text-ink-muted hover:bg-surface-2"
          }`}
        >
          <FilterIcon className="h-3.5 w-3.5" />
        </button>
        {filtrosAbertos && (
          <FiltrosPanel
            filtros={filtrosAvancados}
            onChange={onFiltrosAvancadosChange}
            buscas={buscas}
            buscaIdFiltro={buscaIdFiltro}
            onSelecionarBusca={onSelecionarBusca}
            mostrarCobertura={mostrarCobertura}
            onToggleCobertura={onToggleCobertura}
            onFechar={() => setFiltrosAbertos(false)}
          />
        )}
        {CANAIS.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => onToggleCanalFiltro(c.id)}
            aria-pressed={canaisFiltro.has(c.id)}
            className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
              canaisFiltro.has(c.id)
                ? "border-primary bg-primary/15 text-primary"
                : "border-line text-ink-muted hover:border-line-strong hover:text-ink"
            }`}
          >
            {c.label}
          </button>
        ))}
        <button
          type="button"
          onClick={onToggleApenasRetomar}
          aria-pressed={apenasRetomar}
          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
            apenasRetomar
              ? "border-status-negociando bg-status-negociando/15 text-status-negociando"
              : "border-line text-ink-muted hover:border-line-strong hover:text-ink"
          }`}
        >
          <ClockIcon className="h-3 w-3" /> Precisa retomar
        </button>

        <div className="ml-auto flex items-center gap-1.5">
          <SortIcon className="h-3.5 w-3.5 text-ink-muted" />
          <select
            value={sort}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            aria-label="Ordenar leads"
            className="rounded-control border border-line bg-surface-2 px-2 py-1 text-xs text-ink focus:border-primary focus:outline-none"
          >
            <option value="score">Score</option>
            <option value="nome">Nome</option>
            <option value="recente">Recente</option>
          </select>
        </div>

        <div className="inline-flex items-center overflow-hidden rounded-control border border-line">
          <button
            type="button"
            onClick={() => onExportar("xlsx")}
            title="Exportar .xlsx"
            aria-label="Exportar leads em .xlsx"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-ink hover:bg-surface-2"
          >
            <DownloadIcon className="h-3.5 w-3.5" /> XLSX
          </button>
          <button
            type="button"
            onClick={() => onExportar("csv")}
            title="Exportar .csv"
            aria-label="Exportar leads em .csv"
            className="border-l border-line px-2.5 py-1 text-xs font-medium text-ink hover:bg-surface-2"
          >
            CSV
          </button>
        </div>
        </div>
      </div>

      {selecaoLote.size > 0 && (
        <div className="flex shrink-0 items-center gap-2 border-b border-line bg-primary/10 px-3 py-2">
          <span className="text-xs font-semibold text-ink">{selecaoLote.size} selecionado(s)</span>
          <button
            type="button"
            onClick={copiarMensagensLote}
            className="ml-auto inline-flex items-center gap-1.5 rounded-control bg-primary px-2.5 py-1 text-xs font-semibold text-white hover:bg-primary-hover"
          >
            <CopyIcon className="h-3.5 w-3.5" />
            Copiar todas as mensagens
          </button>
          <button
            type="button"
            onClick={onLimparLote}
            aria-label="Limpar seleção"
            title="Limpar seleção"
            className="inline-flex shrink-0 items-center justify-center rounded-control p-1.5 text-ink-muted hover:bg-surface-2 hover:text-ink"
          >
            <XIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {loadingLeads ? (
          Array.from({ length: 5 }).map((_, i) => <LeadCardSkeleton key={i} />)
        ) : leads.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-14 text-center">
            <InboxIcon className="h-8 w-8 text-ink-muted/60" />
            <p className="text-sm font-semibold text-ink">
              {algumFiltroAtivo ? "Nenhum lead corresponde aos filtros" : "Nenhum lead ainda"}
            </p>
            <p className="text-xs text-ink-muted">
              {algumFiltroAtivo
                ? "Tente ajustar ou limpar os filtros ativos."
                : "Busque por nicho e localização na sidebar pra começar."}
            </p>
          </div>
        ) : (
          leads.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              selecionado={lead.id === leadSelecionadoId}
              onSelecionar={onSelecionarLead}
              selecionadoLote={selecaoLote.has(lead.id)}
              onToggleLote={onToggleLote}
              onAtualizarLead={onAtualizarLead}
              onAposAcaoMensagem={onAposAcaoMensagem}
            />
          ))
        )}
      </div>
    </aside>
  );
}
