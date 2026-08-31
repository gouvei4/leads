"use client";

import { useEffect, useState } from "react";
import { STATUS_OPTIONS, type HistoricoEvento, type Lead } from "@/lib/types";
import ScoreRing from "./ScoreRing";
import ChannelChips from "./ChannelChips";
import SiteQualityBadge from "./SiteQualityBadge";
import { useMensagemLead } from "./useMensagemLead";
import HistoricoTimeline from "./HistoricoTimeline";
import { followUpVencido } from "@/lib/followup";
import { corDaTag } from "@/lib/tags";
import {
  XIcon,
  WhatsAppIcon,
  GlobeIcon,
  MapPinIcon,
  InstagramIcon,
  MailIcon,
  TrashIcon,
  CopyIcon,
  CheckIcon,
  RefreshIcon,
  ShieldOffIcon,
} from "../icons";

export default function LeadDetailModal({
  lead,
  onClose,
  onUpdate,
  onDelete,
  onAposAcaoMensagem,
}: {
  lead: Lead;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Lead>, evento?: HistoricoEvento) => void;
  onDelete: (id: string) => void;
  onAposAcaoMensagem: (lead: Lead, tipo: "mensagem_copiada" | "whatsapp_aberto") => void;
}) {
  const [obs, setObs] = useState(lead.observacoes || "");
  const [cnpjInput, setCnpjInput] = useState(lead.cnpj || "");
  const [buscandoCnpj, setBuscandoCnpj] = useState(false);
  const [erroCnpj, setErroCnpj] = useState<string | null>(null);
  const [novaTag, setNovaTag] = useState("");
  const m = useMensagemLead(lead, onUpdate, onAposAcaoMensagem);

  function adicionarTag() {
    const nome = novaTag.trim();
    if (!nome) return;
    if (lead.tags?.some((t) => t.nome.toLowerCase() === nome.toLowerCase())) {
      setNovaTag("");
      return;
    }
    onUpdate(lead.id, { tags: [...(lead.tags ?? []), { nome, cor: corDaTag(nome) }] });
    setNovaTag("");
  }

  function removerTag(nome: string) {
    onUpdate(lead.id, { tags: (lead.tags ?? []).filter((t) => t.nome !== nome) });
  }

  async function bloquearLead() {
    if (!confirm(`Bloquear o telefone de "${lead.nome}"? Ele não reaparece em buscas futuras, em nenhum projeto.`)) {
      return;
    }
    await fetch("/api/blacklist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tipo: "telefone", valor: lead.telefone, motivo: `Bloqueado manualmente: ${lead.nome}` }),
    });
  }

  async function buscarCnpj() {
    const limpo = cnpjInput.replace(/\D/g, "");
    if (limpo.length !== 14) {
      setErroCnpj("CNPJ precisa ter 14 dígitos.");
      return;
    }
    setBuscandoCnpj(true);
    setErroCnpj(null);
    try {
      const r = await fetch(`/api/cnpj/${limpo}`);
      const d = await r.json();
      if (!d.ok) throw new Error(d.erro || "Erro ao buscar CNPJ");
      onUpdate(lead.id, { cnpj: limpo, cnpj_info: d.info });
    } catch (e) {
      setErroCnpj((e as Error).message);
    } finally {
      setBuscandoCnpj(false);
    }
  }

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
        aria-labelledby="lead-detail-title"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-card border border-line bg-surface p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <ScoreRing lead={lead} size={48} />
            <div>
              <h3 id="lead-detail-title" className="text-base font-semibold text-ink">
                {lead.nome}
              </h3>
              <p className="mt-0.5 text-sm text-ink-muted">{lead.endereco}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="shrink-0 rounded-control p-1.5 text-ink-muted hover:bg-surface-2 hover:text-ink"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <ChannelChips lead={lead} />
          <SiteQualityBadge qualidade={lead.site_qualidade} />
        </div>

        <div className="mt-4">
          <label htmlFor="detail-cnpj" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-muted">
            CNPJ (opcional — cole o CNPJ do negócio pra puxar dados da Receita)
          </label>
          <div className="flex gap-2">
            <input
              id="detail-cnpj"
              value={cnpjInput}
              onChange={(e) => setCnpjInput(e.target.value)}
              placeholder="00.000.000/0000-00"
              className="flex-1 rounded-control border border-line bg-surface-2 px-3 py-2 text-sm text-ink focus:border-primary focus:outline-none"
            />
            <button
              type="button"
              onClick={buscarCnpj}
              disabled={buscandoCnpj || !cnpjInput.trim()}
              className="shrink-0 rounded-control bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              {buscandoCnpj ? "Buscando..." : "Buscar dados"}
            </button>
          </div>
          {erroCnpj && <p className="mt-1 text-xs text-status-recusado">{erroCnpj}</p>}
          {lead.cnpj_info && (
            <div className="mt-2 space-y-1 rounded-control border border-line bg-surface-2 px-3 py-2 text-xs text-ink-muted">
              {lead.cnpj_info.razao_social && <div className="font-medium text-ink">{lead.cnpj_info.razao_social}</div>}
              {lead.cnpj_info.porte && <div>Porte: {lead.cnpj_info.porte}</div>}
              {lead.cnpj_info.data_abertura && <div>Aberta em: {lead.cnpj_info.data_abertura}</div>}
              {lead.cnpj_info.email && <div>E-mail: {lead.cnpj_info.email}</div>}
              {lead.cnpj_info.socios.length > 0 && <div>Sócios: {lead.cnpj_info.socios.join(", ")}</div>}
            </div>
          )}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          {lead.telefone && (
            <div className="text-ink-muted">
              Telefone
              <div className="tabular-nums text-ink">{lead.telefone}</div>
            </div>
          )}
          {lead.rating != null && (
            <div className="text-ink-muted">
              Avaliação
              <div className="tabular-nums text-ink">
                {lead.rating.toFixed(1)} ({lead.avaliacoes ?? 0})
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {lead.site && (
            <a
              href={lead.site}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-control border border-line px-3 py-2 text-xs font-medium text-ink hover:bg-surface-2"
            >
              <GlobeIcon className="h-3.5 w-3.5" /> Site
            </a>
          )}
          {lead.instagram && (
            <a
              href={lead.instagram}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-control border border-line px-3 py-2 text-xs font-medium text-ink hover:bg-surface-2"
            >
              <InstagramIcon className="h-3.5 w-3.5" /> Instagram
            </a>
          )}
          {lead.link_maps && (
            <a
              href={lead.link_maps}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-control border border-line px-3 py-2 text-xs font-medium text-ink hover:bg-surface-2"
            >
              <MapPinIcon className="h-3.5 w-3.5" /> Maps
            </a>
          )}
          {lead.email && (
            <a
              href={`mailto:${lead.email}`}
              className="inline-flex items-center gap-1.5 rounded-control border border-line px-3 py-2 text-xs font-medium text-ink hover:bg-surface-2"
            >
              <MailIcon className="h-3.5 w-3.5" /> {lead.email}
            </a>
          )}
        </div>

        <div className="mt-5">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Mensagem</span>
            <button
              type="button"
              onClick={m.regenerar}
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              <RefreshIcon className="h-3 w-3" /> Regenerar
            </button>
          </div>
          <textarea
            value={m.editando ? m.textoEdicao : m.texto}
            onChange={(e) => {
              if (!m.editando) m.abrirEdicao();
              m.setTextoEdicao(e.target.value);
            }}
            onBlur={() => m.editando && m.salvarEdicao()}
            rows={5}
            placeholder="Nenhuma mensagem gerada ainda."
            className="w-full resize-none rounded-control border border-line bg-surface-2 px-3 py-2 text-sm text-ink focus:border-primary focus:outline-none"
          />
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={m.copiar}
              className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-control px-3 py-2 text-xs font-semibold transition-colors ${
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
                className="inline-flex items-center gap-1.5 rounded-control bg-whatsapp px-3 py-2 text-xs font-semibold text-white transition-colors hover:brightness-110"
              >
                <WhatsAppIcon className="h-3.5 w-3.5" /> Enviar WhatsApp
              </a>
            )}
          </div>
        </div>

        <div className="mt-5">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-muted">Tags</span>
          <div className="flex flex-wrap gap-1.5">
            {(lead.tags ?? []).map((t) => (
              <span
                key={t.nome}
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
                style={{ backgroundColor: `${t.cor}1A`, color: t.cor }}
              >
                {t.nome}
                <button type="button" onClick={() => removerTag(t.nome)} aria-label={`Remover tag ${t.nome}`}>
                  <XIcon className="h-2.5 w-2.5" />
                </button>
              </span>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            <input
              value={novaTag}
              onChange={(e) => setNovaTag(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  adicionarTag();
                }
              }}
              placeholder="Nova tag..."
              className="flex-1 rounded-control border border-line bg-surface-2 px-3 py-1.5 text-xs text-ink focus:border-primary focus:outline-none"
            />
            <button
              type="button"
              onClick={adicionarTag}
              className="rounded-control border border-line px-2.5 py-1.5 text-xs font-medium text-ink hover:bg-surface-2"
            >
              Adicionar
            </button>
          </div>
        </div>

        <label htmlFor="detail-status" className="mt-5 block text-xs font-semibold uppercase tracking-wide text-ink-muted">
          Status
        </label>
        <select
          id="detail-status"
          value={lead.status}
          onChange={(e) => onUpdate(lead.id, { status: e.target.value })}
          className="mt-1.5 w-full rounded-control border border-line bg-surface-2 px-3 py-2 text-sm text-ink focus:border-primary focus:outline-none"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <label htmlFor="detail-contato" className="mt-4 block text-xs font-semibold uppercase tracking-wide text-ink-muted">
          Último contato
        </label>
        <input
          id="detail-contato"
          type="date"
          value={lead.ultimo_contato || ""}
          onChange={(e) => onUpdate(lead.id, { ultimo_contato: e.target.value })}
          className="mt-1.5 w-full rounded-control border border-line bg-surface-2 px-3 py-2 text-sm text-ink focus:border-primary focus:outline-none"
        />

        <label htmlFor="detail-followup" className="mt-4 block text-xs font-semibold uppercase tracking-wide text-ink-muted">
          Lembrete de follow-up
          {followUpVencido(lead) && <span className="ml-2 font-semibold text-status-negociando">vencido</span>}
        </label>
        <input
          id="detail-followup"
          type="date"
          value={lead.follow_up || ""}
          onChange={(e) => onUpdate(lead.id, { follow_up: e.target.value || null })}
          className="mt-1.5 w-full rounded-control border border-line bg-surface-2 px-3 py-2 text-sm text-ink focus:border-primary focus:outline-none"
        />

        <label htmlFor="detail-obs" className="mt-4 block text-xs font-semibold uppercase tracking-wide text-ink-muted">
          Observações
        </label>
        <textarea
          id="detail-obs"
          value={obs}
          onChange={(e) => setObs(e.target.value)}
          onBlur={() =>
            onUpdate(lead.id, { observacoes: obs }, { tipo: "nota", data: new Date().toISOString(), texto: obs })
          }
          rows={3}
          className="mt-1.5 w-full resize-none rounded-control border border-line bg-surface-2 px-3 py-2 text-sm text-ink focus:border-primary focus:outline-none"
        />

        <div className="mt-5">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-muted">Histórico</span>
          <HistoricoTimeline eventos={lead.historico ?? []} />
        </div>

        <div className="mt-5 flex justify-end gap-2 border-t border-line pt-4">
          <button
            type="button"
            onClick={bloquearLead}
            className="inline-flex items-center gap-1.5 rounded-control px-3 py-2 text-xs font-medium text-ink-muted hover:bg-surface-2 hover:text-ink"
          >
            <ShieldOffIcon className="h-3.5 w-3.5" /> Bloquear
          </button>
          <button
            type="button"
            onClick={() => {
              onDelete(lead.id);
              onClose();
            }}
            className="inline-flex items-center gap-1.5 rounded-control px-3 py-2 text-xs font-medium text-status-recusado hover:bg-status-recusado/10"
          >
            <TrashIcon className="h-3.5 w-3.5" /> Excluir lead
          </button>
        </div>
      </div>
    </div>
  );
}
