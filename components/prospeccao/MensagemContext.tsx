"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { MessageTemplate } from "@/lib/types";

interface Perfil {
  meu_nome: string;
  meu_link: string;
}

interface MensagemContextValue {
  templates: MessageTemplate[];
  perfil: Perfil;
  temChaveGoogle: boolean | null;
  recarregarTemplates: () => Promise<void>;
  salvarPerfil: (perfil: Perfil) => Promise<void>;
}

const DEFAULT_PERFIL: Perfil = { meu_nome: "", meu_link: "" };

const MensagemContext = createContext<MensagemContextValue>({
  templates: [],
  perfil: DEFAULT_PERFIL,
  temChaveGoogle: null,
  recarregarTemplates: async () => {},
  salvarPerfil: async () => {},
});

export function useMensagemContext(): MensagemContextValue {
  return useContext(MensagemContext);
}

export function MensagemProvider({ children }: { children: ReactNode }) {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [perfil, setPerfil] = useState<Perfil>(DEFAULT_PERFIL);
  const [temChaveGoogle, setTemChaveGoogle] = useState<boolean | null>(null);

  const carregarTemplates = useCallback(async () => {
    try {
      const r = await fetch("/api/templates");
      const d = await r.json();
      setTemplates(d.templates ?? []);
    } catch {
      // silencioso — regenerar/gerar cai no fallback genérico
    }
  }, []);

  const salvarPerfil = useCallback(async (novo: Perfil) => {
    setPerfil(novo);
    await fetch("/api/perfil", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(novo),
    });
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carrega templates, perfil e status da chave ao montar
    carregarTemplates();
    fetch("/api/perfil")
      .then((r) => r.json())
      .then((d) => setPerfil({ meu_nome: d.meu_nome ?? "", meu_link: d.meu_link ?? "" }))
      .catch(() => {});
    fetch("/api/config")
      .then((r) => r.json())
      .then((d) => setTemChaveGoogle(Boolean(d.tem_chave)))
      .catch(() => setTemChaveGoogle(null));
  }, [carregarTemplates]);

  return (
    <MensagemContext.Provider
      value={{ templates, perfil, temChaveGoogle, recarregarTemplates: carregarTemplates, salvarPerfil }}
    >
      {children}
    </MensagemContext.Provider>
  );
}
