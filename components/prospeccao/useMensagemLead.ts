"use client";

import { useState } from "react";
import type { Lead, HistoricoEvento } from "@/lib/types";
import { regenerarMensagem } from "@/lib/mensagemTemplate";
import { waLink } from "@/lib/whatsapp";
import { useMensagemContext } from "./MensagemContext";

export function useMensagemLead(
  lead: Lead,
  onAtualizarLead: (id: string, updates: Partial<Lead>, evento?: HistoricoEvento) => void,
  onAposAcaoMensagem: (lead: Lead, tipo: "mensagem_copiada" | "whatsapp_aberto") => void
) {
  const { templates, perfil } = useMensagemContext();
  const [copiado, setCopiado] = useState(false);
  const [editando, setEditando] = useState(false);
  const [textoEdicao, setTextoEdicao] = useState(lead.mensagem_gerada ?? "");

  const texto = lead.mensagem_gerada ?? "";
  const link = waLink(lead.telefone || "", texto);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto);
    } catch {
      alert(`Não foi possível copiar automaticamente. Copie manualmente:\n\n${texto}`);
      return;
    }
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
    onAposAcaoMensagem(lead, "mensagem_copiada");
  }

  function registrarWhatsappAberto() {
    onAposAcaoMensagem(lead, "whatsapp_aberto");
  }

  function regenerar() {
    const nova = regenerarMensagem(lead, templates, perfil);
    onAtualizarLead(lead.id, {
      mensagem_gerada: nova.texto,
      mensagem_template_id: nova.templateId,
      mensagem_variacao_idx: nova.variacaoIdx,
    });
    setTextoEdicao(nova.texto);
  }

  function abrirEdicao() {
    setTextoEdicao(texto);
    setEditando(true);
  }

  function salvarEdicao() {
    onAtualizarLead(lead.id, { mensagem_gerada: textoEdicao });
    setEditando(false);
  }

  return {
    texto,
    link,
    copiado,
    copiar,
    registrarWhatsappAberto,
    regenerar,
    editando,
    abrirEdicao,
    fecharEdicao: () => setEditando(false),
    textoEdicao,
    setTextoEdicao,
    salvarEdicao,
  };
}
