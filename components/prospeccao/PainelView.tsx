"use client";

import { useEffect, useMemo, useState } from "react";
import { STATUS_OPTIONS, STATUS_COLORS, type Lead, type MessageTemplate } from "@/lib/types";
import { calcularScore, faixaScore, type FaixaScore } from "@/lib/score";
import {
  calcularFunil,
  calcularResumo,
  desempenhoPor,
  desempenhoPorTemplate,
  evolucaoSemanal,
  type DesempenhoGrupo,
} from "@/lib/dashboard";

function StatCard({ label, valor, sub, cor }: { label: string; valor: number; sub?: string; cor?: string }) {
  return (
    <div className="rounded-card border border-line bg-surface p-4">
      <div className="text-2xl font-bold tabular-nums text-ink" style={cor ? { color: cor } : undefined}>
        {valor}
      </div>
      <div className="mt-1 text-xs text-ink-muted">
        {label}
        {sub && <span className="ml-1 text-ink-muted/70">· {sub}</span>}
      </div>
    </div>
  );
}

function ListaDesempenho({ titulo, grupos }: { titulo: string; grupos: DesempenhoGrupo[] }) {
  const top = grupos.slice(0, 6);
  return (
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">{titulo}</h3>
      {top.length === 0 ? (
        <p className="mt-2 text-xs text-ink-muted">Sem dados ainda.</p>
      ) : (
        <div className="mt-3 space-y-2.5">
          {top.map((g) => (
            <div key={g.chave}>
              <div className="flex items-center justify-between text-xs">
                <span className="truncate pr-2 font-medium text-ink">{g.chave}</span>
                <span className="shrink-0 tabular-nums text-ink-muted">
                  {g.clientes}/{g.total} · {g.taxaConversao}%
                </span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-2">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-300"
                  style={{ width: `${Math.max(2, g.taxaConversao)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PainelView({ leads }: { leads: Lead[] }) {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);

  useEffect(() => {
    fetch("/api/templates")
      .then((r) => r.json())
      .then((d) => setTemplates(d.templates ?? []))
      .catch(() => {});
  }, []);

  const porStatus = useMemo(() => {
    const contagem: Record<string, number> = {};
    STATUS_OPTIONS.forEach((s) => {
      contagem[s] = 0;
    });
    leads.forEach((l) => {
      contagem[l.status] = (contagem[l.status] ?? 0) + 1;
    });
    return contagem;
  }, [leads]);

  const porFaixa = useMemo(() => {
    const contagem: Record<FaixaScore, number> = { baixo: 0, medio: 0, alto: 0 };
    leads.forEach((l) => {
      contagem[faixaScore(calcularScore(l))]++;
    });
    return contagem;
  }, [leads]);

  const funil = useMemo(() => calcularFunil(leads), [leads]);
  const resumo = useMemo(() => calcularResumo(leads), [leads]);
  const porNicho = useMemo(() => desempenhoPor(leads, "termo_busca"), [leads]);
  const porCidade = useMemo(() => desempenhoPor(leads, "cidade"), [leads]);
  const porTemplate = useMemo(() => desempenhoPorTemplate(leads), [leads]);
  const semanal = useMemo(() => evolucaoSemanal(leads), [leads]);

  const total = leads.length;
  const semSite = leads.filter((l) => !l.site).length;
  const enriquecidos = leads.filter((l) => l.instagram || l.email || l.rating != null).length;
  const maxFaixa = Math.max(1, porFaixa.baixo, porFaixa.medio, porFaixa.alto);
  const maxFunil = Math.max(1, ...funil.map((e) => e.qtd));
  const maxSemanal = Math.max(1, ...semanal.flatMap((p) => [p.contatados, p.clientes]));

  function nomeTemplate(id: string | null): string {
    if (!id) return "Sem template (mensagem genérica)";
    return templates.find((t) => t.id === id)?.nome ?? "Template removido";
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <h2 className="text-lg font-bold text-ink">Painel</h2>
      <p className="mt-1 text-sm text-ink-muted">Visão geral e desempenho dos leads deste projeto.</p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total de leads" valor={total} />
        <StatCard label="Pipeline ativo" valor={resumo.ativos} />
        <StatCard label="Follow-ups pendentes" valor={resumo.followUpsPendentes} cor="var(--color-status-negociando)" />
        <StatCard label="Clientes no mês" valor={resumo.clientesNoMes} cor="var(--color-status-cliente)" />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Sem site" valor={semSite} sub={total ? `${Math.round((semSite / total) * 100)}%` : undefined} />
        <StatCard label="Enriquecidos" valor={enriquecidos} />
        <StatCard label="Score alto" valor={porFaixa.alto} cor="var(--color-score-alto)" />
        <StatCard label="Score médio" valor={porFaixa.medio} cor="var(--color-score-medio)" />
      </div>

      <h3 className="mt-8 text-sm font-semibold uppercase tracking-wide text-ink-muted">
        Funil de conversão (leads que já passaram por cada etapa)
      </h3>
      <div className="mt-3 space-y-2.5">
        {funil.map((etapa) => (
          <div key={etapa.nome}>
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-ink">{etapa.nome}</span>
              <span className="tabular-nums text-ink-muted">
                {etapa.qtd}
                {etapa.taxaDaEtapaAnterior != null && (
                  <span className="ml-1.5 text-ink-muted/70">({etapa.taxaDaEtapaAnterior}% da anterior)</span>
                )}
              </span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${(etapa.qtd / maxFunil) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <h3 className="mt-8 text-sm font-semibold uppercase tracking-wide text-ink-muted">Funil por status (atual)</h3>
      <div className="mt-3 space-y-2.5">
        {STATUS_OPTIONS.map((status) => {
          const qtd = porStatus[status] ?? 0;
          const pct = total ? (qtd / total) * 100 : 0;
          const cor = STATUS_COLORS[status];
          return (
            <div key={status}>
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-ink">{status}</span>
                <span className="tabular-nums text-ink-muted">{qtd}</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-surface-2">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${pct}%`, backgroundColor: cor }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <h3 className="mt-8 text-sm font-semibold uppercase tracking-wide text-ink-muted">Distribuição de score</h3>
      <div className="mt-3 flex h-28 items-end gap-4">
        {(["baixo", "medio", "alto"] as const).map((faixa) => {
          const qtd = porFaixa[faixa];
          const alturaPct = Math.max(6, (qtd / maxFaixa) * 100);
          return (
            <div key={faixa} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
              <span className="text-xs font-semibold tabular-nums text-ink">{qtd}</span>
              <div
                className="w-full rounded-t-md transition-all duration-300"
                style={{ height: `${alturaPct}%`, backgroundColor: `var(--color-score-${faixa})` }}
              />
              <span className="text-[11px] font-medium capitalize text-ink-muted">{faixa}</span>
            </div>
          );
        })}
      </div>

      <h3 className="mt-8 text-sm font-semibold uppercase tracking-wide text-ink-muted">Evolução semanal</h3>
      {semanal.length === 0 ? (
        <p className="mt-2 text-xs text-ink-muted">Ainda sem histórico suficiente pra montar a evolução semanal.</p>
      ) : (
        <>
          <div className="mt-2 flex items-center gap-4 text-[11px] text-ink-muted">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-primary" /> Contatados
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-status-cliente" /> Clientes
            </span>
          </div>
          <div className="mt-3 flex h-32 items-end gap-3 overflow-x-auto">
            {semanal.map((p) => (
              <div key={p.semana} className="flex h-full min-w-[44px] flex-1 flex-col items-center justify-end gap-1">
                <div className="flex h-full w-full items-end justify-center gap-1">
                  <div
                    className="w-2.5 rounded-t-sm bg-primary transition-all duration-300"
                    style={{ height: `${Math.max(3, (p.contatados / maxSemanal) * 100)}%` }}
                    title={`${p.contatados} contatados`}
                  />
                  <div
                    className="w-2.5 rounded-t-sm bg-status-cliente transition-all duration-300"
                    style={{ height: `${Math.max(3, (p.clientes / maxSemanal) * 100)}%` }}
                    title={`${p.clientes} clientes`}
                  />
                </div>
                <span className="text-[10px] text-ink-muted">{p.semana.slice(6)}</span>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <ListaDesempenho titulo="Desempenho por nicho" grupos={porNicho} />
        <ListaDesempenho titulo="Desempenho por cidade" grupos={porCidade} />
      </div>

      <h3 className="mt-8 text-sm font-semibold uppercase tracking-wide text-ink-muted">
        Desempenho por template (taxa de resposta)
      </h3>
      {porTemplate.length === 0 || (porTemplate.length === 1 && porTemplate[0]!.templateId === null && total === 0) ? (
        <p className="mt-2 text-xs text-ink-muted">Sem dados ainda.</p>
      ) : (
        <div className="mt-3 space-y-2.5">
          {porTemplate.map((t) => (
            <div key={t.templateId ?? "sem-template"}>
              <div className="flex items-center justify-between text-xs">
                <span className="truncate pr-2 font-medium text-ink">{nomeTemplate(t.templateId)}</span>
                <span className="shrink-0 tabular-nums text-ink-muted">
                  {t.respostas}/{t.total} · {t.taxaResposta}%
                </span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-2">
                <div
                  className="h-full rounded-full bg-status-respondeu transition-all duration-300"
                  style={{ width: `${Math.max(2, t.taxaResposta)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {total === 0 && (
        <p className="mt-8 text-sm text-ink-muted">Ainda não há leads neste projeto — busque na sidebar pra começar.</p>
      )}
    </div>
  );
}
