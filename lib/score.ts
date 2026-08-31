import type { Lead } from "./types";

export type FaixaScore = "baixo" | "medio" | "alto";

export interface FatorScore {
  label: string;
  pontos: number;
  ativo: boolean;
}

export interface ResultadoScore {
  total: number;
  fatores: FatorScore[];
}

const NICHOS_TICKET_ALTO = [
  "advocaci",
  "advogad",
  "odont",
  "dentist",
  "estétic",
  "estetic",
  "imobiliári",
  "arquitet",
  "engenhari",
  "contabilidade",
  "clínica médic",
  "clinica medic",
  "cirurgi",
  "consultório",
  "consultorio",
  "veterinári",
  "veterinari",
  "pet shop",
  "petshop",
  "academia",
  "personal trainer",
  "nutricionista",
];

function categoriaTicketAlto(nicho: string | undefined): boolean {
  if (!nicho) return false;
  const n = nicho.toLowerCase();
  return NICHOS_TICKET_ALTO.some((k) => n.includes(k));
}

function negocioRecente(dataAbertura: string): boolean {
  const data = new Date(dataAbertura);
  if (Number.isNaN(data.getTime())) return false;
  const doisAnosAtras = new Date();
  doisAnosAtras.setFullYear(doisAnosAtras.getFullYear() - 2);
  return data >= doisAnosAtras;
}

export function calcularScoreDetalhado(lead: Lead): ResultadoScore {
  const fatores: FatorScore[] = [];
  let total = 0;

  const temSite = Boolean(lead.site);
  if (!temSite) {
    fatores.push({ label: "Sem site", pontos: 45, ativo: true });
    total += 45;
  } else if (lead.site_qualidade === "fraca") {
    fatores.push({ label: "Site fraco", pontos: 25, ativo: true });
    total += 25;
  } else {
    fatores.push({ label: "Tem site OK", pontos: 0, ativo: false });
  }

  if (lead.telefone) {
    fatores.push({ label: "Telefone disponível", pontos: 15, ativo: true });
    total += 15;
  } else {
    fatores.push({ label: "Sem telefone", pontos: 0, ativo: false });
  }

  const avaliacoes = lead.avaliacoes ?? 0;
  if (lead.rating != null && avaliacoes >= 3) {
    const pts = Math.round((lead.rating / 5) * 20);
    fatores.push({ label: `Nota ${lead.rating.toFixed(1)} no Google — negócio validado`, pontos: pts, ativo: true });
    total += pts;
  } else {
    fatores.push({ label: "Nota do Google insuficiente pra validar", pontos: 0, ativo: false });
  }

  if (avaliacoes >= 20) {
    fatores.push({ label: `${avaliacoes} avaliações — volume alto`, pontos: 10, ativo: true });
    total += 10;
  } else if (avaliacoes >= 3) {
    fatores.push({ label: `${avaliacoes} avaliações`, pontos: 5, ativo: true });
    total += 5;
  } else {
    fatores.push({ label: "Poucas avaliações", pontos: 0, ativo: false });
  }

  const semPresencaDigital = !temSite && !lead.instagram;
  if (semPresencaDigital) {
    fatores.push({ label: "Nenhuma presença digital (sem site nem Instagram)", pontos: 10, ativo: true });
    total += 10;
  }

  if (categoriaTicketAlto(lead.termo_busca)) {
    fatores.push({ label: "Categoria de ticket alto", pontos: 8, ativo: true });
    total += 8;
  }

  if (lead.cnpj_info?.data_abertura && negocioRecente(lead.cnpj_info.data_abertura)) {
    fatores.push({ label: "Negócio aberto recentemente", pontos: 7, ativo: true });
    total += 7;
  }

  return { total: Math.max(0, Math.min(100, total)), fatores };
}

export function calcularScore(lead: Lead): number {
  return calcularScoreDetalhado(lead).total;
}

export function faixaScore(score: number): FaixaScore {
  if (score >= 70) return "alto";
  if (score >= 40) return "medio";
  return "baixo";
}
