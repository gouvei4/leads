"use client";

import { useEffect, useState } from "react";
import styles from "./AppShell.module.css";
import Header from "./Header";
import ProjectSwitcher from "./ProjectSwitcher";
import ProspeccaoShell from "./prospeccao/ProspeccaoShell";
import TemplatesView from "./prospeccao/TemplatesView";
import BlacklistView from "./prospeccao/BlacklistView";
import BuscarPanel from "./BuscarPanel";
import ConfigPanel from "./ConfigPanel";
import type { Projeto } from "@/lib/types";

export type TabId = "leads" | "buscar" | "templates" | "blacklist" | "config";

const PROJETO_STORAGE_KEY = "prospector:projetoId";

export default function AppShell() {
  const [activeTab, setActiveTab] = useState<TabId>("leads");
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [projetoId, setProjetoId] = useState("");
  const [carregandoProjetos, setCarregandoProjetos] = useState(true);

  useEffect(() => {
    fetch("/api/projetos")
      .then((r) => r.json())
      .then((d) => {
        const lista: Projeto[] = d.projetos ?? [];
        setProjetos(lista);
        const salvo = typeof window !== "undefined" ? localStorage.getItem(PROJETO_STORAGE_KEY) : null;
        const valido = lista.find((p) => p.id === salvo);
        setProjetoId(valido ? valido.id : (lista[0]?.id ?? ""));
      })
      .finally(() => setCarregandoProjetos(false));
  }, []);

  function selecionarProjeto(id: string) {
    setProjetoId(id);
    localStorage.setItem(PROJETO_STORAGE_KEY, id);
  }

  async function criarProjeto(nome: string) {
    const r = await fetch("/api/projetos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome }),
    });
    const novo = await r.json();
    setProjetos((prev) => [...prev, novo].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")));
    selecionarProjeto(novo.id);
  }

  async function renomearProjeto(id: string, nome: string) {
    await fetch(`/api/projetos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome }),
    });
    setProjetos((prev) => prev.map((p) => (p.id === id ? { ...p, nome } : p)));
  }

  async function excluirProjeto(id: string) {
    await fetch(`/api/projetos/${id}`, { method: "DELETE" });
    setProjetos((prev) => {
      const restantes = prev.filter((p) => p.id !== id);
      if (projetoId === id) selecionarProjeto(restantes[0]?.id ?? "");
      return restantes;
    });
  }

  return (
    <>
      <Header activeTab={activeTab} onChangeTab={setActiveTab} />
      <ProjectSwitcher
        projetos={projetos}
        projetoId={projetoId}
        carregando={carregandoProjetos}
        onSelecionar={selecionarProjeto}
        onCriar={criarProjeto}
        onRenomear={renomearProjeto}
        onExcluir={excluirProjeto}
      />
      <div className={`${styles.leadsPanel} ${activeTab === "leads" ? styles.leadsPanelActive : ""}`}>
        <ProspeccaoShell projetoId={projetoId} />
      </div>

      <main className={`${styles.main} ${activeTab !== "leads" ? styles.mainActive : ""}`}>
        <section className={`${styles.panel} ${activeTab === "buscar" ? styles.panelActive : ""}`}>
          <BuscarPanel projetoId={projetoId} projetoNome={projetos.find((p) => p.id === projetoId)?.nome ?? ""} />
        </section>
        <section className={`${styles.panel} ${activeTab === "templates" ? styles.panelActive : ""}`}>
          <TemplatesView />
        </section>
        <section className={`${styles.panel} ${activeTab === "blacklist" ? styles.panelActive : ""}`}>
          <BlacklistView />
        </section>
        <section className={`${styles.panel} ${activeTab === "config" ? styles.panelActive : ""}`}>
          <ConfigPanel active={activeTab === "config"} />
        </section>
      </main>
    </>
  );
}
