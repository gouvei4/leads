"use client";

import { useEffect, useRef, useState } from "react";
import type { MessageTemplate } from "@/lib/types";
import { renderizarTemplate, dadosDoLead, VARIAVEIS_TEMPLATE } from "@/lib/mensagemTemplate";
import { NICHOS_SUGERIDOS } from "@/lib/nichos";
import { PlusIcon, TrashIcon, CopyIcon, InboxIcon } from "../icons";

const LEAD_EXEMPLO = {
  nome: "Padaria Pão Quente",
  bairro: "Centro",
  cidade: "Campinas",
  rating: 4.7,
  avaliacoes: 128,
};

const AVISO_CARACTERES = 900;
const MAX_VARIACOES = 5;

interface RascunhoTemplate {
  id: string | null;
  nome: string;
  nicho_padrao: string;
  variacoes: string[];
}

function rascunhoVazio(): RascunhoTemplate {
  return { id: null, nome: "", nicho_padrao: "", variacoes: [""] };
}

export default function TemplatesView() {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [rascunho, setRascunho] = useState<RascunhoTemplate>(rascunhoVazio());
  const [salvando, setSalvando] = useState(false);
  const [focoIdx, setFocoIdx] = useState(0);
  const [perfil, setPerfil] = useState({ meu_nome: "Seu Nome", meu_link: "seulink.com" });
  const textareaRefs = useRef<(HTMLTextAreaElement | null)[]>([]);

  async function carregar() {
    setCarregando(true);
    setErro(null);
    try {
      const r = await fetch("/api/templates");
      const d = await r.json();
      if (!r.ok) throw new Error(d.erro || "Erro ao carregar templates");
      setTemplates(d.templates ?? []);
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carrega templates e perfil ao montar
    carregar();
    fetch("/api/perfil")
      .then((r) => r.json())
      .then((d) => setPerfil({ meu_nome: d.meu_nome || "Seu Nome", meu_link: d.meu_link || "seulink.com" }))
      .catch(() => {});
  }, []);

  function selecionarTemplate(t: MessageTemplate) {
    setRascunho({ id: t.id, nome: t.nome, nicho_padrao: t.nicho_padrao ?? "", variacoes: [...t.variacoes] });
    setFocoIdx(0);
  }

  function novoTemplate() {
    setRascunho(rascunhoVazio());
    setFocoIdx(0);
  }

  function duplicarTemplate(t: MessageTemplate) {
    setRascunho({ id: null, nome: `${t.nome} (cópia)`, nicho_padrao: t.nicho_padrao ?? "", variacoes: [...t.variacoes] });
    setFocoIdx(0);
  }

  function atualizarVariacao(idx: number, texto: string) {
    setRascunho((prev) => ({ ...prev, variacoes: prev.variacoes.map((v, i) => (i === idx ? texto : v)) }));
  }

  function adicionarVariacao() {
    setRascunho((prev) => (prev.variacoes.length >= MAX_VARIACOES ? prev : { ...prev, variacoes: [...prev.variacoes, ""] }));
  }

  function removerVariacao(idx: number) {
    setRascunho((prev) => {
      if (prev.variacoes.length <= 1) return prev;
      return { ...prev, variacoes: prev.variacoes.filter((_, i) => i !== idx) };
    });
    setFocoIdx((prev) => Math.max(0, prev - 1));
  }

  function inserirVariavel(chave: string) {
    const idx = focoIdx;
    const el = textareaRefs.current[idx];
    const atual = rascunho.variacoes[idx] ?? "";
    const token = `{{${chave}}}`;

    if (!el) {
      atualizarVariacao(idx, atual + token);
      return;
    }
    const start = el.selectionStart ?? atual.length;
    const end = el.selectionEnd ?? atual.length;
    const novo = atual.slice(0, start) + token + atual.slice(end);
    atualizarVariacao(idx, novo);
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + token.length;
      el.setSelectionRange(pos, pos);
    });
  }

  async function salvar() {
    const nome = rascunho.nome.trim();
    const variacoes = rascunho.variacoes.map((v) => v.trim()).filter(Boolean);
    if (!nome || variacoes.length === 0) return;

    setSalvando(true);
    try {
      const corpo = { nome, nicho_padrao: rascunho.nicho_padrao.trim() || null, variacoes };
      if (rascunho.id) {
        await fetch(`/api/templates/${rascunho.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(corpo),
        });
      } else {
        await fetch("/api/templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(corpo),
        });
      }
      await carregar();
      novoTemplate();
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setSalvando(false);
    }
  }

  async function excluir(id: string) {
    if (!confirm("Excluir este template? Leads que já usaram ele mantêm a mensagem gerada.")) return;
    await fetch(`/api/templates/${id}`, { method: "DELETE" });
    if (rascunho.id === id) novoTemplate();
    await carregar();
  }

  const previewTexto = rascunho.variacoes[focoIdx]?.trim()
    ? renderizarTemplate(
        rascunho.variacoes[focoIdx]!,
        dadosDoLead(
          { ...LEAD_EXEMPLO, termo_busca: rascunho.nicho_padrao || "seu nicho" },
          perfil.meu_nome,
          perfil.meu_link
        )
      )
    : "";

  return (
    <div className="mx-auto flex h-full max-w-6xl gap-6 overflow-hidden p-6">
      <aside className="flex w-72 shrink-0 flex-col gap-3 overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-ink">Templates de mensagem</h2>
        </div>
        <button
          type="button"
          onClick={novoTemplate}
          className="inline-flex items-center justify-center gap-1.5 rounded-control border border-dashed border-line-strong px-3 py-2 text-sm font-medium text-ink-muted hover:border-primary hover:text-primary"
        >
          <PlusIcon className="h-4 w-4" /> Novo template
        </button>

        {carregando ? (
          <p className="text-sm text-ink-muted">Carregando...</p>
        ) : templates.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-2 py-10 text-center">
            <InboxIcon className="h-7 w-7 text-ink-muted/60" />
            <p className="text-xs text-ink-muted">
              Nenhum template ainda. Sem templates, os leads usam uma mensagem genérica padrão.
            </p>
          </div>
        ) : (
          <ul className="space-y-1.5">
            {templates.map((t) => (
              <li key={t.id}>
                <div
                  className={`flex items-center gap-1 rounded-control border px-2.5 py-2 ${
                    rascunho.id === t.id ? "border-primary bg-primary/5" : "border-line bg-surface"
                  }`}
                >
                  <button type="button" onClick={() => selecionarTemplate(t)} className="min-w-0 flex-1 text-left">
                    <div className="truncate text-sm font-medium text-ink">{t.nome}</div>
                    {t.nicho_padrao && <div className="truncate text-xs text-ink-muted">Padrão: {t.nicho_padrao}</div>}
                  </button>
                  <button
                    type="button"
                    onClick={() => duplicarTemplate(t)}
                    title="Duplicar"
                    aria-label={`Duplicar ${t.nome}`}
                    className="shrink-0 rounded-control p-1.5 text-ink-muted hover:bg-surface-2 hover:text-ink"
                  >
                    <CopyIcon className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => excluir(t.id)}
                    title="Excluir"
                    aria-label={`Excluir ${t.nome}`}
                    className="shrink-0 rounded-control p-1.5 text-ink-muted hover:bg-status-recusado/10 hover:text-status-recusado"
                  >
                    <TrashIcon className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
        {erro && <p className="text-xs text-status-recusado">{erro}</p>}
      </aside>

      <section className="flex-1 overflow-y-auto pr-1">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="tpl-nome" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-muted">
              Nome do template
            </label>
            <input
              id="tpl-nome"
              value={rascunho.nome}
              onChange={(e) => setRascunho((prev) => ({ ...prev, nome: e.target.value }))}
              placeholder="Ex: Abordagem padrão"
              className="w-full rounded-control border border-line bg-surface-2 px-3 py-2 text-sm text-ink focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="tpl-nicho" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-muted">
              Nicho padrão (opcional)
            </label>
            <input
              id="tpl-nicho"
              list="tpl-nichos-sugeridos"
              value={rascunho.nicho_padrao}
              onChange={(e) => setRascunho((prev) => ({ ...prev, nicho_padrao: e.target.value }))}
              placeholder="Ex: clínica odontológica"
              className="w-full rounded-control border border-line bg-surface-2 px-3 py-2 text-sm text-ink focus:border-primary focus:outline-none"
            />
            <datalist id="tpl-nichos-sugeridos">
              {NICHOS_SUGERIDOS.map((n) => (
                <option key={n} value={n} />
              ))}
            </datalist>
          </div>
        </div>

        <div className="mt-4">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Inserir variável no texto em foco
          </span>
          <div className="flex flex-wrap gap-1.5">
            {VARIAVEIS_TEMPLATE.map((v) => (
              <button
                key={v.chave}
                type="button"
                onClick={() => inserirVariavel(v.chave)}
                className="rounded-full border border-line px-2.5 py-1 text-xs font-medium text-ink-muted hover:border-primary hover:text-primary"
              >
                {`{{${v.chave}}}`}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
              Variações ({rascunho.variacoes.length}/{MAX_VARIACOES}) — sorteamos uma por lead
            </span>
            <button
              type="button"
              onClick={adicionarVariacao}
              disabled={rascunho.variacoes.length >= MAX_VARIACOES}
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline disabled:cursor-not-allowed disabled:opacity-40 disabled:no-underline"
            >
              <PlusIcon className="h-3 w-3" /> Adicionar variação
            </button>
          </div>

          {rascunho.variacoes.map((v, idx) => (
            <div key={idx}>
              <textarea
                ref={(el) => {
                  textareaRefs.current[idx] = el;
                }}
                value={v}
                onFocus={() => setFocoIdx(idx)}
                onChange={(e) => atualizarVariacao(idx, e.target.value)}
                rows={4}
                placeholder={`Variação ${idx + 1}`}
                className="w-full resize-none rounded-control border border-line bg-surface-2 px-3 py-2 text-sm text-ink focus:border-primary focus:outline-none"
              />
              <div className="mt-1 flex items-center justify-between">
                <span className={`text-xs ${v.length > AVISO_CARACTERES ? "font-semibold text-status-negociando" : "text-ink-muted"}`}>
                  {v.length} caracteres{v.length > AVISO_CARACTERES ? " — mensagem longa, considere encurtar" : ""}
                </span>
                {rascunho.variacoes.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removerVariacao(idx)}
                    className="text-xs font-medium text-ink-muted hover:text-status-recusado"
                  >
                    Remover
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {previewTexto && (
          <div className="mt-4">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-muted">
              Preview (lead de exemplo)
            </span>
            <div className="whitespace-pre-wrap rounded-control border border-line bg-surface-2 px-3 py-2.5 text-sm text-ink">
              {previewTexto}
            </div>
          </div>
        )}

        <div className="mt-5 flex items-center gap-2 border-t border-line pt-4">
          <button
            type="button"
            onClick={salvar}
            disabled={salvando || !rascunho.nome.trim() || !rascunho.variacoes.some((v) => v.trim())}
            className="rounded-control bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {salvando ? "Salvando..." : rascunho.id ? "Salvar alterações" : "Criar template"}
          </button>
          {rascunho.id && (
            <button
              type="button"
              onClick={novoTemplate}
              className="rounded-control px-4 py-2 text-sm font-medium text-ink-muted hover:bg-surface-2"
            >
              Cancelar edição
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
