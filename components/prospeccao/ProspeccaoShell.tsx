"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Sidebar, { type SortOption, type UltimaBusca, type ViewId } from "./Sidebar";
import PainelView from "./PainelView";
import LeadDetailModal from "./LeadDetailModal";
import AtalhosModal from "./AtalhosModal";
import { canaisDoLead, type Canal } from "./ChannelChips";
import { useToast } from "./Toast";
import { useProjeto } from "./ProjetoContext";
import { filtrosVazios, type FiltrosAvancados } from "./FiltrosPanel";
import { calcularScore } from "@/lib/score";
import { followUpVencido } from "@/lib/followup";
import { STATUS_OPTIONS, type Busca, type HistoricoEvento, type Lead } from "@/lib/types";
import type { SugestaoLocalizacao } from "@/lib/places";

function CarregandoView() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-line border-t-primary" />
    </div>
  );
}

const MapaView = dynamic(() => import("./MapaView"), { ssr: false, loading: CarregandoView });
const KanbanView = dynamic(() => import("./KanbanView"), { ssr: false, loading: CarregandoView });

export default function ProspeccaoShell() {
  const { mostrarToast } = useToast();
  const { projetoId } = useProjeto();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [erroLeads, setErroLeads] = useState<string | null>(null);

  const projetoIdRef = useRef(projetoId);
  useEffect(() => {
    projetoIdRef.current = projetoId;
  }, [projetoId]);

  const carregarLeads = useCallback(async () => {
    if (!projetoId) {
      setLeads([]);
      return;
    }
    const alvo = projetoId;
    setLoadingLeads(true);
    setErroLeads(null);
    try {
      const r = await fetch(
        "/api/leads?" + new URLSearchParams({ projeto: alvo, cidade: "", status: "", termo: "", q: "" })
      );
      const d = await r.json();
      if (!r.ok) throw new Error(d.erro || "Erro ao carregar leads");
      if (projetoIdRef.current !== alvo) return;
      setLeads(d.leads ?? []);
    } catch (e) {
      if (projetoIdRef.current === alvo) setErroLeads((e as Error).message);
    } finally {
      if (projetoIdRef.current === alvo) setLoadingLeads(false);
    }
  }, [projetoId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- busca os leads ao montar ou trocar de projeto
    carregarLeads();
  }, [carregarLeads]);

  const [buscas, setBuscas] = useState<Busca[]>([]);
  const carregarBuscas = useCallback(async () => {
    if (!projetoId) {
      setBuscas([]);
      return;
    }
    try {
      const r = await fetch("/api/buscas?" + new URLSearchParams({ projeto: projetoId }));
      const d = await r.json();
      setBuscas(d.buscas ?? []);
    } catch {
      // silencioso — histórico de buscas é só uma conveniência
    }
  }, [projetoId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- busca o histórico de buscas ao montar ou trocar de projeto
    carregarBuscas();
  }, [carregarBuscas]);

  const [nicho, setNicho] = useState("");
  const [localizacaoTexto, setLocalizacaoTexto] = useState("");
  const [localizacaoSelecionada, setLocalizacaoSelecionada] = useState<{
    placeId: string;
    lat: number;
    lng: number;
  } | null>(null);
  const [sugestoes, setSugestoes] = useState<SugestaoLocalizacao[]>([]);
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false);
  const [resolvendoLocal, setResolvendoLocal] = useState(false);
  const [raioKm, setRaioKm] = useState(5);
  const [buscando, setBuscando] = useState(false);
  const [erroBusca, setErroBusca] = useState<string | null>(null);
  const [ultimaBusca, setUltimaBusca] = useState<UltimaBusca | null>(null);

  function onLocalizacaoTextoChange(v: string) {
    setLocalizacaoTexto(v);
    setLocalizacaoSelecionada(null);
  }

  useEffect(() => {
    if (!localizacaoTexto.trim() || localizacaoSelecionada || resolvendoLocal) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- limpa sugestões quando o campo esvazia ou já foi resolvido
      setSugestoes([]);
      return;
    }
    const handle = setTimeout(async () => {
      try {
        const r = await fetch("/api/prospeccao/autocomplete?" + new URLSearchParams({ input: localizacaoTexto }));
        const d = await r.json();
        setSugestoes(d.sugestoes ?? []);
        setMostrarSugestoes(true);
      } catch {
        setSugestoes([]);
      }
    }, 350);
    return () => clearTimeout(handle);
  }, [localizacaoTexto, localizacaoSelecionada, resolvendoLocal]);

  async function selecionarSugestao(s: SugestaoLocalizacao) {
    setLocalizacaoTexto(s.texto);
    setMostrarSugestoes(false);
    setSugestoes([]);
    // trava o efeito de autocomplete imediatamente — a resolução do lat/lng é
    // assíncrona, sem isso o texto já mudado reabriria sugestões antes do
    // fetch abaixo terminar
    setResolvendoLocal(true);
    try {
      const r = await fetch("/api/prospeccao/details?" + new URLSearchParams({ place_id: s.placeId }));
      const d = await r.json();
      if (r.ok && d.lat != null && d.lng != null) {
        setLocalizacaoSelecionada({ placeId: s.placeId, lat: d.lat, lng: d.lng });
      }
    } catch {
      // usuário pode tentar de novo — não é um erro fatal
    } finally {
      setResolvendoLocal(false);
    }
  }

  async function buscar() {
    if (!localizacaoSelecionada || !projetoId || !nicho.trim()) return;
    setBuscando(true);
    setErroBusca(null);
    try {
      const r = await fetch("/api/prospeccao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projeto_id: projetoId,
          nicho,
          localizacao_texto: localizacaoTexto,
          raio_m: raioKm * 1000,
          lat: localizacaoSelecionada.lat,
          lng: localizacaoSelecionada.lng,
        }),
      });
      const d = await r.json();
      if (!d.ok) throw new Error(d.erro || "Erro na busca");
      setUltimaBusca({
        total_no_raio: d.total_no_raio,
        sem_site: d.sem_site,
        enriquecidos: d.enriquecidos,
        novos: d.novos,
        duplicados: d.duplicados,
      });
      await Promise.all([carregarLeads(), carregarBuscas()]);
    } catch (e) {
      setErroBusca((e as Error).message);
    } finally {
      setBuscando(false);
    }
  }

  const [view, setView] = useState<ViewId>("mapa");
  const [sort, setSort] = useState<SortOption>("score");
  const [canaisFiltro, setCanaisFiltro] = useState<Set<Canal>>(new Set());
  const [leadSelecionado, setLeadSelecionado] = useState<Lead | null>(null);
  const [selecaoLote, setSelecaoLote] = useState<Set<string>>(new Set());
  const [apenasRetomar, setApenasRetomar] = useState(false);
  const [buscaTextual, setBuscaTextual] = useState("");
  const [filtrosAvancados, setFiltrosAvancados] = useState<FiltrosAvancados>(filtrosVazios());
  const [buscaIdFiltro, setBuscaIdFiltro] = useState<string | null>(null);
  const [mostrarCobertura, setMostrarCobertura] = useState(false);
  const [leadFocadoId, setLeadFocadoId] = useState<string | null>(null);
  const [mostrarAtalhos, setMostrarAtalhos] = useState(false);

  function atualizarFiltrosAvancados(patch: Partial<FiltrosAvancados>) {
    setFiltrosAvancados((prev) => ({ ...prev, ...patch }));
  }

  function toggleCanalFiltro(c: Canal) {
    setCanaisFiltro((prev) => {
      const next = new Set(prev);
      if (next.has(c)) next.delete(c);
      else next.add(c);
      return next;
    });
  }

  function toggleLote(id: string) {
    setSelecaoLote((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const leadsFiltrados = useMemo(() => {
    let lista = leads;
    if (canaisFiltro.size > 0) {
      lista = lista.filter((l) => {
        const canais = canaisDoLead(l);
        return Array.from(canaisFiltro).every((c) => canais[c]);
      });
    }
    if (apenasRetomar) lista = lista.filter(followUpVencido);
    if (buscaTextual.trim()) {
      const q = buscaTextual.trim().toLowerCase();
      lista = lista.filter((l) => l.nome.toLowerCase().includes(q));
    }
    if (filtrosAvancados.status.size > 0) {
      lista = lista.filter((l) => filtrosAvancados.status.has(l.status));
    }
    if (filtrosAvancados.scoreMin > 0) {
      lista = lista.filter((l) => calcularScore(l) >= filtrosAvancados.scoreMin);
    }
    if (filtrosAvancados.siteQualidade.size > 0) {
      lista = lista.filter((l) => l.site_qualidade && filtrosAvancados.siteQualidade.has(l.site_qualidade));
    }
    if (filtrosAvancados.desde) {
      lista = lista.filter((l) => (l.ultimo_contato || "") >= filtrosAvancados.desde);
    }
    if (buscaIdFiltro) {
      lista = lista.filter((l) => l.busca_id === buscaIdFiltro);
    }
    const copia = [...lista];
    if (sort === "score") copia.sort((a, b) => calcularScore(b) - calcularScore(a));
    else if (sort === "nome") copia.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
    else copia.sort((a, b) => (b.criado_em || "").localeCompare(a.criado_em || ""));
    return copia;
  }, [leads, canaisFiltro, apenasRetomar, buscaTextual, filtrosAvancados, buscaIdFiltro, sort]);

  async function atualizarLead(id: string, updates: Partial<Lead>, eventoExtra?: HistoricoEvento) {
    const atual = leads.find((l) => l.id === id) ?? (leadSelecionado?.id === id ? leadSelecionado : undefined);
    let evento = eventoExtra;
    if (!evento && updates.status && atual && updates.status !== atual.status) {
      evento = { tipo: "status", data: new Date().toISOString(), de: atual.status, para: updates.status };
    }

    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, ...updates } : l)));
    setLeadSelecionado((prev) => (prev && prev.id === id ? { ...prev, ...updates } : prev));

    await fetch(`/api/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(evento ? { ...updates, evento } : updates),
    });
  }

  function aposAcaoMensagem(lead: Lead, tipo: "mensagem_copiada" | "whatsapp_aberto") {
    atualizarLead(lead.id, {}, { tipo, data: new Date().toISOString() });
    if (lead.status === "Novo") {
      mostrarToast(tipo === "mensagem_copiada" ? "Mensagem copiada." : "WhatsApp aberto.", {
        label: "Marcar como Contatado",
        onClick: () => atualizarLead(lead.id, { status: "Contatado" }),
      });
    }
  }

  useEffect(() => {
    function abrirAtalhos() {
      setMostrarAtalhos((v) => !v);
    }
    window.addEventListener("prospector:atalhos", abrirAtalhos);
    return () => window.removeEventListener("prospector:atalhos", abrirAtalhos);
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const alvo = e.target as HTMLElement | null;
      const emCampo =
        !!alvo && (["INPUT", "TEXTAREA", "SELECT"].includes(alvo.tagName) || alvo.isContentEditable);

      if (e.key === "?") {
        if (emCampo) return;
        e.preventDefault();
        setMostrarAtalhos((v) => !v);
        return;
      }
      if (e.key === "/") {
        if (emCampo) return;
        e.preventDefault();
        document.getElementById("busca-textual-input")?.focus();
        return;
      }
      if (emCampo) return;

      if (e.key === "j" || e.key === "J") {
        e.preventDefault();
        setLeadFocadoId((atualId) => {
          if (leadsFiltrados.length === 0) return atualId;
          const idx = leadsFiltrados.findIndex((l) => l.id === atualId);
          return leadsFiltrados[Math.min(leadsFiltrados.length - 1, idx + 1)]!.id;
        });
      } else if (e.key === "k" || e.key === "K") {
        e.preventDefault();
        setLeadFocadoId((atualId) => {
          if (leadsFiltrados.length === 0) return atualId;
          const idx = leadsFiltrados.findIndex((l) => l.id === atualId);
          return leadsFiltrados[Math.max(0, idx - 1)]!.id;
        });
      } else if (e.key === "c" || e.key === "C") {
        const lead = leadsFiltrados.find((l) => l.id === leadFocadoId);
        if (lead?.mensagem_gerada) {
          navigator.clipboard.writeText(lead.mensagem_gerada).then(() => aposAcaoMensagem(lead, "mensagem_copiada"));
        }
      } else if (/^[1-6]$/.test(e.key) && leadFocadoId) {
        const novoStatus = STATUS_OPTIONS[Number(e.key) - 1];
        if (novoStatus) atualizarLead(leadFocadoId, { status: novoStatus });
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // Re-registra quando a lista filtrada ou o lead em foco mudam — não a cada render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadsFiltrados, leadFocadoId]);

  async function excluirLead(id: string) {
    setLeads((prev) => prev.filter((l) => l.id !== id));
    setLeadSelecionado((prev) => (prev && prev.id === id ? null : prev));
    setSelecaoLote((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    await fetch(`/api/leads/${id}`, { method: "DELETE" });
  }

  return (
    <div className="flex h-full w-full overflow-hidden bg-bg text-ink">
      <Sidebar
        nicho={nicho}
        onNichoChange={setNicho}
        localizacaoTexto={localizacaoTexto}
        onLocalizacaoTextoChange={onLocalizacaoTextoChange}
        sugestoes={sugestoes}
        onSelecionarSugestao={selecionarSugestao}
        mostrarSugestoes={mostrarSugestoes}
        raioKm={raioKm}
        onRaioKmChange={setRaioKm}
        buscando={buscando}
        onBuscar={buscar}
        buscaDesabilitada={!nicho.trim() || !localizacaoSelecionada || resolvendoLocal || !projetoId}
        erroBusca={erroBusca}
        ultimaBusca={ultimaBusca}
        view={view}
        onViewChange={setView}
        leads={leadsFiltrados}
        loadingLeads={loadingLeads}
        leadSelecionadoId={leadFocadoId ?? leadSelecionado?.id ?? null}
        onSelecionarLead={(lead) => {
          setLeadFocadoId(lead.id);
          setLeadSelecionado(lead);
        }}
        sort={sort}
        onSortChange={setSort}
        canaisFiltro={canaisFiltro}
        onToggleCanalFiltro={toggleCanalFiltro}
        onExportar={(formato) => {
          window.location.href = "/api/export?" + new URLSearchParams({ projeto: projetoId, formato });
        }}
        selecaoLote={selecaoLote}
        onToggleLote={toggleLote}
        onLimparLote={() => setSelecaoLote(new Set())}
        onAtualizarLead={atualizarLead}
        onAposAcaoMensagem={aposAcaoMensagem}
        apenasRetomar={apenasRetomar}
        onToggleApenasRetomar={() => setApenasRetomar((v) => !v)}
        buscaTextual={buscaTextual}
        onBuscaTextualChange={setBuscaTextual}
        filtrosAvancados={filtrosAvancados}
        onFiltrosAvancadosChange={atualizarFiltrosAvancados}
        buscas={buscas}
        buscaIdFiltro={buscaIdFiltro}
        onSelecionarBusca={setBuscaIdFiltro}
        mostrarCobertura={mostrarCobertura}
        onToggleCobertura={() => setMostrarCobertura((v) => !v)}
      />

      <main className="relative isolate flex-1 overflow-hidden">
        {erroLeads && (
          <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between gap-3 bg-status-recusado/15 px-4 py-2 text-sm text-status-recusado">
            <span>{erroLeads}</span>
            <button type="button" onClick={carregarLeads} className="shrink-0 font-semibold underline">
              Tentar de novo
            </button>
          </div>
        )}

        {view === "mapa" && (
          <MapaView
            leads={leadsFiltrados}
            centro={localizacaoSelecionada}
            raioMetros={raioKm * 1000}
            leadSelecionadoId={leadSelecionado?.id ?? null}
            onSelecionarLead={setLeadSelecionado}
            buscas={mostrarCobertura ? buscas : []}
          />
        )}
        {view === "kanban" && (
          <KanbanView
            leads={leadsFiltrados}
            loading={loadingLeads}
            onUpdateStatus={(id, status) => atualizarLead(id, { status })}
            onSelecionarLead={(lead) => {
              setLeadFocadoId(lead.id);
              setLeadSelecionado(lead);
            }}
          />
        )}
        {view === "painel" && <PainelView leads={leads} />}
      </main>

      {leadSelecionado && (
        <LeadDetailModal
          lead={leadSelecionado}
          onClose={() => setLeadSelecionado(null)}
          onUpdate={atualizarLead}
          onDelete={excluirLead}
          onAposAcaoMensagem={aposAcaoMensagem}
        />
      )}

      {mostrarAtalhos && <AtalhosModal onClose={() => setMostrarAtalhos(false)} />}
    </div>
  );
}
