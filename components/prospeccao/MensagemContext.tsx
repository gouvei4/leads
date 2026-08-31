"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { MessageTemplate } from "@/lib/types";

interface Perfil {
  meu_nome: string;
  meu_link: string;
}

interface MensagemContextValue {
  templates: MessageTemplate[];
  perfil: Perfil;
  recarregarTemplates: () => void;
}

const DEFAULT_PERFIL: Perfil = { meu_nome: "", meu_link: "" };

const MensagemContext = createContext<MensagemContextValue>({
  templates: [],
  perfil: DEFAULT_PERFIL,
  recarregarTemplates: () => {},
});

export function useMensagemContext(): MensagemContextValue {
  return useContext(MensagemContext);
}

export function MensagemProvider({ children }: { children: ReactNode }) {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [perfil, setPerfil] = useState<Perfil>(DEFAULT_PERFIL);

  async function carregarTemplates() {
    try {
      const r = await fetch("/api/templates");
      const d = await r.json();
      setTemplates(d.templates ?? []);
    } catch {
      // silencioso — regenerar/gerar cai no fallback genérico
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carrega templates e perfil ao montar
    carregarTemplates();
    fetch("/api/perfil")
      .then((r) => r.json())
      .then((d) => setPerfil({ meu_nome: d.meu_nome ?? "", meu_link: d.meu_link ?? "" }))
      .catch(() => {});
  }, []);

  return (
    <MensagemContext.Provider value={{ templates, perfil, recarregarTemplates: carregarTemplates }}>
      {children}
    </MensagemContext.Provider>
  );
}
