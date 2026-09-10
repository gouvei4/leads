import type { Lead } from "./types";

const STATUS_FECHADOS = new Set(["Cliente", "Recusado"]);

export function dataEmDias(dias: number): string {
  const data = new Date();
  data.setDate(data.getDate() + dias);
  return data.toISOString().slice(0, 10);
}

/** Cadência inicial simples, aplicada ao avançar o lead no funil. */
export function proximoFollowUp(status: string): string | null {
  if (status === "Contatado") return dataEmDias(3);
  if (status === "Respondeu" || status === "Negociando") return dataEmDias(2);
  if (STATUS_FECHADOS.has(status)) return null;
  return null;
}

export function followUpVencido(lead: Pick<Lead, "follow_up" | "status">): boolean {
  if (!lead.follow_up) return false;
  if (STATUS_FECHADOS.has(lead.status)) return false;
  const hoje = new Date().toISOString().slice(0, 10);
  return lead.follow_up <= hoje;
}
