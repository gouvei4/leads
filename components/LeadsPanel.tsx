"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./LeadsPanel.module.css";
import StatsRow from "./StatsRow";
import LeadsToolbar from "./LeadsToolbar";
import LeadsTable from "./LeadsTable";
import Pagination from "./Pagination";
import EmptyState from "./EmptyState";
import type { Lead, Stats } from "@/lib/types";

const PAGE_SIZE = 10;

export default function LeadsPanel({ active, projetoId }: { active: boolean; projetoId: string }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [cidades, setCidades] = useState<string[]>([]);
  const [termos, setTermos] = useState<string[]>([]);
  const [statusOptions, setStatusOptions] = useState<readonly string[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [erro, setErro] = useState<string | null>(null);

  const [filtroCidade, setFiltroCidade] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [filtroTermo, setFiltroTermo] = useState("");
  const [filtroBusca, setFiltroBusca] = useState("");

  // Mantém o projetoId "atual" acessível de dentro de requisições em andamento,
  // pra descartar respostas de um projeto que já não é mais o selecionado
  // (ex: troca rápida de projeto ou a corrida entre o fetch inicial sem
  // projeto e o fetch do projeto recém-criado/selecionado).
  const projetoIdRef = useRef(projetoId);
  useEffect(() => {
    projetoIdRef.current = projetoId;
  }, [projetoId]);

  const carregarStats = useCallback(async (projetoIdAlvo: string) => {
    const r = await fetch("/api/stats?" + new URLSearchParams({ projeto: projetoIdAlvo }));
    const d = await r.json();
    if (!r.ok) throw new Error(d.erro || "Erro ao carregar estatísticas");
    if (projetoIdRef.current === projetoIdAlvo) setStats(d);
  }, []);

  const carregarLeads = useCallback(async () => {
    if (!projetoId) return;
    const projetoIdAlvo = projetoId;
    setErro(null);
    try {
      await carregarStats(projetoIdAlvo);

      const params = new URLSearchParams({
        projeto: projetoIdAlvo,
        cidade: filtroCidade,
        status: filtroStatus,
        termo: filtroTermo,
        q: filtroBusca,
      });
      const r = await fetch("/api/leads?" + params.toString());
      const d = await r.json();
      if (!r.ok) throw new Error(d.erro || "Erro ao carregar leads");
      if (projetoIdRef.current !== projetoIdAlvo) return;

      setCidades(d.cidades);
      setTermos(d.termos);
      setStatusOptions(d.status_options);
      setLeads(d.leads);
      setPaginaAtual(1);
    } catch (e) {
      if (projetoIdRef.current === projetoIdAlvo) setErro((e as Error).message);
    }
  }, [carregarStats, projetoId, filtroCidade, filtroStatus, filtroTermo, filtroBusca]);

  useEffect(() => {
    if (!active) return;
    if (!projetoId) {
      /* eslint-disable react-hooks/set-state-in-effect -- limpa a tela ao ficar sem projeto selecionado */
      setLeads([]);
      setStats(null);
      setCidades([]);
      setTermos([]);
      setStatusOptions([]);
      setPaginaAtual(1);
      /* eslint-enable react-hooks/set-state-in-effect */
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- busca dados ao ativar a aba ou trocar de projeto
    carregarLeads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, projetoId]);

  async function atualizarLead(id: string, campo: "status" | "ultimo_contato" | "observacoes", valor: string) {
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, [campo]: valor } : l)));
    await fetch(`/api/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [campo]: valor }),
    });
    if (projetoId) carregarStats(projetoId);
  }

  async function excluirLead(id: string) {
    await fetch(`/api/leads/${id}`, { method: "DELETE" });
    carregarLeads();
  }

  const totalPaginas = Math.max(1, Math.ceil(leads.length / PAGE_SIZE));
  const paginaSegura = Math.min(Math.max(1, paginaAtual), totalPaginas);
  const inicio = (paginaSegura - 1) * PAGE_SIZE;
  const pageLeads = leads.slice(inicio, inicio + PAGE_SIZE);

  return (
    <div>
      <StatsRow stats={stats} statusOptions={statusOptions} />

      <LeadsToolbar
        cidades={cidades}
        termos={termos}
        statusOptions={statusOptions}
        filtroCidade={filtroCidade}
        filtroStatus={filtroStatus}
        filtroTermo={filtroTermo}
        filtroBusca={filtroBusca}
        onFiltroCidadeChange={setFiltroCidade}
        onFiltroStatusChange={setFiltroStatus}
        onFiltroTermoChange={setFiltroTermo}
        onFiltroBuscaChange={setFiltroBusca}
        onFiltrar={carregarLeads}
        onExportar={() => {
          window.location.href = "/api/export?" + new URLSearchParams({ projeto: projetoId });
        }}
      />

      {erro && <div className={styles.errorBanner}>{erro}</div>}

      <div className={styles.tableCard}>
        {leads.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <LeadsTable
              leads={pageLeads}
              statusOptions={statusOptions}
              onUpdateLead={atualizarLead}
              onDeleteLead={excluirLead}
            />
            <Pagination
              paginaAtual={paginaSegura}
              totalItens={leads.length}
              pageSize={PAGE_SIZE}
              onGoToPage={setPaginaAtual}
            />
          </>
        )}
      </div>
    </div>
  );
}
