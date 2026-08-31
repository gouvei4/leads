import type { Lead } from "./types";

const STATUS_FECHADOS = new Set(["Cliente", "Recusado"]);

export function followUpVencido(lead: Pick<Lead, "follow_up" | "status">): boolean {
  if (!lead.follow_up) return false;
  if (STATUS_FECHADOS.has(lead.status)) return false;
  const hoje = new Date().toISOString().slice(0, 10);
  return lead.follow_up <= hoje;
}
