import type { Lead } from "./types";

const ETAPAS_FUNIL = ["Contatado", "Respondeu", "Negociando", "Cliente"] as const;
const ETAPAS_RESPOSTA = new Set(["Respondeu", "Negociando", "Cliente"]);
const STATUS_FECHADOS = new Set(["Cliente", "Recusado"]);

function statusAlcancados(lead: Lead): Set<string> {
  const s = new Set<string>([lead.status]);
  (lead.historico ?? []).forEach((e) => {
    if (e.tipo === "status" && e.para) s.add(e.para);
  });
  return s;
}

export interface EtapaFunil {
  nome: string;
  qtd: number;
  taxaDaEtapaAnterior: number | null;
}

/** Funil "alguma vez alcançou" — usa status atual + histórico, não só o snapshot. */
export function calcularFunil(leads: Lead[]): EtapaFunil[] {
  const alcancados = leads.map(statusAlcancados);
  const etapas: EtapaFunil[] = [{ nome: "Total", qtd: leads.length, taxaDaEtapaAnterior: null }];
  let anterior = leads.length;
  for (const etapa of ETAPAS_FUNIL) {
    const qtd = alcancados.filter((s) => s.has(etapa)).length;
    etapas.push({ nome: etapa, qtd, taxaDaEtapaAnterior: anterior > 0 ? Math.round((qtd / anterior) * 100) : 0 });
    anterior = qtd;
  }
  return etapas;
}

export interface DesempenhoGrupo {
  chave: string;
  total: number;
  clientes: number;
  taxaConversao: number;
}

export function desempenhoPor(leads: Lead[], campo: "termo_busca" | "cidade"): DesempenhoGrupo[] {
  const grupos = new Map<string, Lead[]>();
  leads.forEach((l) => {
    const chave = (l[campo] || "").trim() || "—";
    if (!grupos.has(chave)) grupos.set(chave, []);
    grupos.get(chave)!.push(l);
  });
  return Array.from(grupos.entries())
    .map(([chave, ls]) => {
      const clientes = ls.filter((l) => l.status === "Cliente").length;
      return { chave, total: ls.length, clientes, taxaConversao: ls.length ? Math.round((clientes / ls.length) * 100) : 0 };
    })
    .sort((a, b) => b.taxaConversao - a.taxaConversao || b.total - a.total);
}

export interface DesempenhoTemplate {
  templateId: string | null;
  total: number;
  respostas: number;
  taxaResposta: number;
}

export function desempenhoPorTemplate(leads: Lead[]): DesempenhoTemplate[] {
  const grupos = new Map<string | null, Lead[]>();
  leads.forEach((l) => {
    const id = l.mensagem_template_id ?? null;
    if (!grupos.has(id)) grupos.set(id, []);
    grupos.get(id)!.push(l);
  });
  return Array.from(grupos.entries())
    .map(([templateId, ls]) => {
      const respostas = ls.filter((l) => {
        const alcancados = statusAlcancados(l);
        return Array.from(alcancados).some((s) => ETAPAS_RESPOSTA.has(s));
      }).length;
      return { templateId, total: ls.length, respostas, taxaResposta: ls.length ? Math.round((respostas / ls.length) * 100) : 0 };
    })
    .sort((a, b) => b.taxaResposta - a.taxaResposta || b.total - a.total);
}

function semanaDe(iso: string): string {
  const d = new Date(iso);
  const inicioAno = new Date(d.getFullYear(), 0, 1);
  const dias = Math.floor((d.getTime() - inicioAno.getTime()) / 86400000);
  const semana = Math.ceil((dias + inicioAno.getDay() + 1) / 7);
  return `${d.getFullYear()}-S${String(semana).padStart(2, "0")}`;
}

export interface PontoSemanal {
  semana: string;
  contatados: number;
  clientes: number;
}

export function evolucaoSemanal(leads: Lead[]): PontoSemanal[] {
  const mapa = new Map<string, PontoSemanal>();
  leads.forEach((l) => {
    (l.historico ?? []).forEach((e) => {
      if (e.tipo !== "status") return;
      if (e.para !== "Contatado" && e.para !== "Cliente") return;
      const semana = semanaDe(e.data);
      if (!mapa.has(semana)) mapa.set(semana, { semana, contatados: 0, clientes: 0 });
      const ponto = mapa.get(semana)!;
      if (e.para === "Contatado") ponto.contatados++;
      if (e.para === "Cliente") ponto.clientes++;
    });
  });
  return Array.from(mapa.values())
    .sort((a, b) => a.semana.localeCompare(b.semana))
    .slice(-8);
}

export interface ResumoPipeline {
  ativos: number;
  followUpsPendentes: number;
  clientesNoMes: number;
}

export function calcularResumo(leads: Lead[]): ResumoPipeline {
  const hoje = new Date().toISOString().slice(0, 10);
  const mesAtual = hoje.slice(0, 7);
  const ativos = leads.filter((l) => !STATUS_FECHADOS.has(l.status)).length;
  const followUpsPendentes = leads.filter(
    (l) => l.follow_up && l.follow_up <= hoje && !STATUS_FECHADOS.has(l.status)
  ).length;
  const clientesNoMes = leads.filter((l) =>
    (l.historico ?? []).some((e) => e.tipo === "status" && e.para === "Cliente" && e.data.slice(0, 7) === mesAtual)
  ).length;
  return { ativos, followUpsPendentes, clientesNoMes };
}
