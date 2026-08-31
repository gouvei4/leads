"use client";

import type { Lead, HistoricoEvento } from "@/lib/types";
import ScoreRing from "./ScoreRing";
import StatusSelect from "./StatusSelect";
import ChannelChips from "./ChannelChips";
import SiteQualityBadge from "./SiteQualityBadge";
import { useMensagemLead } from "./useMensagemLead";
import { followUpVencido } from "@/lib/followup";
import { WhatsAppIcon, CopyIcon, CheckIcon, RefreshIcon, ExpandIcon, ClockIcon } from "../icons";

export function LeadCardSkeleton() {
  return (
    <div className="animate-pulse rounded-card border border-line bg-surface p-3">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 shrink-0 rounded-full bg-surface-2" />
        <div className="flex-1 space-y-2 py-0.5">
          <div className="h-3.5 w-3/4 rounded bg-surface-2" />
          <div className="h-3 w-1/2 rounded bg-surface-2" />
          <div className="h-5 w-24 rounded-full bg-surface-2" />
        </div>
      </div>
    </div>
  );
}

export default function LeadCard({
  lead,
  selecionado,
  onSelecionar,
  selecionadoLote,
  onToggleLote,
  onAtualizarLead,
  onAposAcaoMensagem,
}: {
  lead: Lead;
  selecionado: boolean;
  onSelecionar: (lead: Lead) => void;
  selecionadoLote: boolean;
  onToggleLote: (id: string) => void;
  onAtualizarLead: (id: string, updates: Partial<Lead>, evento?: HistoricoEvento) => void;
  onAposAcaoMensagem: (lead: Lead, tipo: "mensagem_copiada" | "whatsapp_aberto") => void;
}) {
  const m = useMensagemLead(lead, onAtualizarLead, onAposAcaoMensagem);
  const vencido = followUpVencido(lead);

  return (
    <div
      className={`rounded-card border p-3 transition-colors ${
        vencido
          ? "border-status-negociando/60 bg-status-negociando/5"
          : selecionado
            ? "border-primary bg-primary/5"
            : "border-line bg-surface hover:border-line-strong"
      }`}
    >
      <div className="flex items-start gap-2.5">
        <input
          type="checkbox"
          checked={selecionadoLote}
          onChange={() => onToggleLote(lead.id)}
          onClick={(e) => e.stopPropagation()}
          aria-label={`Selecionar ${lead.nome}`}
          className="mt-1 h-3.5 w-3.5 shrink-0 accent-primary"
        />
        <button
          type="button"
          onClick={() => onSelecionar(lead)}
          className="flex min-w-0 flex-1 items-start gap-3 text-left"
        >
          <ScoreRing lead={lead} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-ink">{lead.nome || "Sem nome"}</div>
            <div className="mt-0.5 truncate text-xs text-ink-muted">{lead.endereco}</div>
            {lead.telefone && <div className="mt-0.5 text-xs tabular-nums text-ink-muted">{lead.telefone}</div>}
          </div>
        </button>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <StatusSelect status={lead.status} onChange={(novo) => onAtualizarLead(lead.id, { status: novo })} />
        <SiteQualityBadge qualidade={lead.site_qualidade} />
        {vencido && (
          <span className="inline-flex items-center gap-1 rounded-full bg-status-negociando/15 px-2 py-0.5 text-[10px] font-semibold text-status-negociando">
            <ClockIcon className="h-2.5 w-2.5" /> retomar
          </span>
        )}
      </div>
      <div className="mt-2">
        <ChannelChips lead={lead} />
      </div>
      {lead.tags && lead.tags.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {lead.tags.map((t) => (
            <span
              key={t.nome}
              className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
              style={{ backgroundColor: `${t.cor}1A`, color: t.cor }}
            >
              {t.nome}
            </span>
          ))}
        </div>
      )}

      <div className="mt-2.5 border-t border-line pt-2.5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={m.copiar}
            className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-control px-2 py-1.5 text-xs font-medium transition-colors ${
              m.copiado ? "bg-status-cliente/15 text-status-cliente" : "bg-surface-2 text-ink hover:bg-line"
            }`}
          >
            {m.copiado ? <CheckIcon className="h-3.5 w-3.5" /> : <CopyIcon className="h-3.5 w-3.5" />}
            {m.copiado ? "Copiado!" : "Copiar mensagem"}
          </button>
          {m.link && (
            <a
              href={m.link}
              target="_blank"
              rel="noreferrer"
              onClick={m.registrarWhatsappAberto}
              title="Abrir WhatsApp"
              aria-label={`Abrir WhatsApp para ${lead.nome}`}
              className="inline-flex shrink-0 items-center justify-center rounded-control bg-whatsapp/15 p-1.5 text-whatsapp transition-colors hover:bg-whatsapp/25"
            >
              <WhatsAppIcon className="h-3.5 w-3.5" />
            </a>
          )}
          <button
            type="button"
            onClick={m.regenerar}
            title="Regenerar mensagem"
            aria-label="Regenerar mensagem"
            className="inline-flex shrink-0 items-center justify-center rounded-control border border-line p-1.5 text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink"
          >
            <RefreshIcon className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={m.editando ? m.fecharEdicao : m.abrirEdicao}
            title="Ver/editar mensagem"
            aria-label="Ver ou editar mensagem completa"
            aria-expanded={m.editando}
            className="inline-flex shrink-0 items-center justify-center rounded-control border border-line p-1.5 text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink"
          >
            <ExpandIcon className="h-3.5 w-3.5" />
          </button>
        </div>

        {m.editando && (
          <div className="mt-2">
            <textarea
              value={m.textoEdicao}
              onChange={(e) => m.setTextoEdicao(e.target.value)}
              rows={5}
              className="w-full resize-none rounded-control border border-line bg-surface-2 px-2.5 py-2 text-xs text-ink focus:border-primary focus:outline-none"
            />
            <div className="mt-1.5 flex justify-end gap-1.5">
              <button
                type="button"
                onClick={m.fecharEdicao}
                className="rounded-control px-2.5 py-1 text-xs font-medium text-ink-muted hover:bg-surface-2"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={m.salvarEdicao}
                className="rounded-control bg-primary px-2.5 py-1 text-xs font-semibold text-white hover:bg-primary-hover"
              >
                Salvar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
