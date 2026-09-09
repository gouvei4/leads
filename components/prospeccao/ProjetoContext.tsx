"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { Projeto } from "@/lib/types";

const STORAGE_KEY = "prospector:projetoId";

interface ProjetoContextValue {
  projetos: Projeto[];
  projetoId: string;
  projetoAtual: Projeto | null;
  carregando: boolean;
  selecionar: (id: string) => void;
  criar: (nome: string) => Promise<void>;
  renomear: (id: string, nome: string) => Promise<void>;
  excluir: (id: string) => Promise<void>;
}

const ProjetoContext = createContext<ProjetoContextValue | null>(null);

export function useProjeto(): ProjetoContextValue {
  const ctx = useContext(ProjetoContext);
  if (!ctx) throw new Error("useProjeto precisa estar dentro de <ProjetoProvider>");
  return ctx;
}

export function ProjetoProvider({ children }: { children: ReactNode }) {
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [projetoId, setProjetoId] = useState("");
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    fetch("/api/projetos")
      .then((r) => r.json())
      .then((d) => {
        const lista: Projeto[] = d.projetos ?? [];
        setProjetos(lista);
        const salvo = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
        const valido = lista.find((p) => p.id === salvo);
        setProjetoId(valido ? valido.id : (lista[0]?.id ?? ""));
      })
      .finally(() => setCarregando(false));
  }, []);

  const selecionar = useCallback((id: string) => {
    setProjetoId(id);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // localStorage indisponível (aba privada etc.) — segue sem persistir
    }
  }, []);

  const criar = useCallback(
    async (nome: string) => {
      const r = await fetch("/api/projetos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome }),
      });
      const novo: Projeto = await r.json();
      setProjetos((prev) => [...prev, novo].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")));
      selecionar(novo.id);
    },
    [selecionar]
  );

  const renomear = useCallback(async (id: string, nome: string) => {
    setProjetos((prev) => prev.map((p) => (p.id === id ? { ...p, nome } : p)));
    await fetch(`/api/projetos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome }),
    });
  }, []);

  const excluir = useCallback(
    async (id: string) => {
      const restantes = projetos.filter((p) => p.id !== id);
      setProjetos(restantes);
      if (projetoId === id) selecionar(restantes[0]?.id ?? "");
      await fetch(`/api/projetos/${id}`, { method: "DELETE" });
    },
    [projetos, projetoId, selecionar]
  );

  const projetoAtual = projetos.find((p) => p.id === projetoId) ?? null;

  return (
    <ProjetoContext.Provider
      value={{ projetos, projetoId, projetoAtual, carregando, selecionar, criar, renomear, excluir }}
    >
      {children}
    </ProjetoContext.Provider>
  );
}
