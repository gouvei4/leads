import { montarMensagem } from "./mensagem";
import type { MessageTemplate } from "./types";

export interface DadosMensagem {
  nome: string;
  nicho: string;
  bairro: string;
  cidade: string;
  nota: string;
  avaliacoes: string;
  meu_nome: string;
  meu_link: string;
}

export const VARIAVEIS_TEMPLATE: { chave: keyof DadosMensagem; label: string }[] = [
  { chave: "nome", label: "Nome do negócio" },
  { chave: "nicho", label: "Nicho" },
  { chave: "bairro", label: "Bairro" },
  { chave: "cidade", label: "Cidade" },
  { chave: "nota", label: "Nota do Google" },
  { chave: "avaliacoes", label: "Nº de avaliações" },
  { chave: "meu_nome", label: "Seu nome" },
  { chave: "meu_link", label: "Seu link" },
];

const VAR_REGEX = /\{\{\s*(\w+)\s*\}\}/g;

export function renderizarTemplate(texto: string, dados: Partial<DadosMensagem>): string {
  return texto
    .replace(VAR_REGEX, (_match, chave: string) => {
      const valor = dados[chave as keyof DadosMensagem];
      return valor && valor.trim() ? valor : "";
    })
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function escolherVariacaoIdx(total: number, excluirIdx?: number | null): number {
  if (total <= 1) return 0;
  let idx = Math.floor(Math.random() * total);
  if (excluirIdx != null) {
    let tentativas = 0;
    while (idx === excluirIdx && tentativas < 10) {
      idx = Math.floor(Math.random() * total);
      tentativas++;
    }
  }
  return idx;
}

export function dadosDoLead(
  lead: {
    nome: string;
    termo_busca?: string;
    bairro?: string;
    cidade?: string;
    rating?: number | null;
    avaliacoes?: number | null;
  },
  meuNome: string,
  meuLink: string
): DadosMensagem {
  return {
    nome: lead.nome || "",
    nicho: lead.termo_busca || "",
    bairro: lead.bairro || "",
    cidade: lead.cidade || "",
    nota: lead.rating != null ? lead.rating.toFixed(1) : "",
    avaliacoes: lead.avaliacoes != null ? String(lead.avaliacoes) : "",
    meu_nome: meuNome || "",
    meu_link: meuLink || "",
  };
}

export function montarBlocoMensagensLote(
  leads: { nome: string; telefone: string; mensagem_gerada?: string }[]
): string {
  return leads
    .map((l) => `Nome: ${l.nome}\nTelefone: ${l.telefone || "—"}\nMensagem: ${l.mensagem_gerada || ""}`)
    .join("\n\n---\n\n");
}

export function escolherTemplatePadrao(templates: MessageTemplate[], nicho: string): MessageTemplate | null {
  const nichoNorm = nicho.trim().toLowerCase();
  const porNicho = templates.find((t) => t.nicho_padrao && t.nicho_padrao.trim().toLowerCase() === nichoNorm);
  if (porNicho) return porNicho;
  return templates.find((t) => !t.nicho_padrao) ?? templates[0] ?? null;
}

export interface MensagemGerada {
  texto: string;
  templateId: string | null;
  variacaoIdx: number | null;
}

/**
 * Gera a mensagem de um lead a partir dos templates cadastrados. Se não
 * houver nenhum template ainda (primeiro uso), cai no template genérico
 * fixo do app pra nunca deixar o lead sem mensagem.
 */
export function gerarMensagemParaLead(
  lead: {
    nome: string;
    termo_busca?: string;
    bairro?: string;
    cidade?: string;
    rating?: number | null;
    avaliacoes?: number | null;
    site_qualidade?: string;
  },
  templates: MessageTemplate[],
  perfil: { meu_nome: string; meu_link: string }
): MensagemGerada {
  const template = escolherTemplatePadrao(templates, lead.termo_busca ?? "");
  if (!template || template.variacoes.length === 0) {
    return {
      texto: montarMensagem(lead.nome, lead.site_qualidade === "fraca"),
      templateId: null,
      variacaoIdx: null,
    };
  }
  const idx = escolherVariacaoIdx(template.variacoes.length);
  const dados = dadosDoLead(lead, perfil.meu_nome, perfil.meu_link);
  return { texto: renderizarTemplate(template.variacoes[idx]!, dados), templateId: template.id, variacaoIdx: idx };
}

/**
 * "Regenerar": sorteia outra variação dentro do MESMO template já usado
 * nesse lead (não troca de template, só a redação).
 */
export function regenerarMensagem(
  lead: {
    nome: string;
    termo_busca?: string;
    bairro?: string;
    cidade?: string;
    rating?: number | null;
    avaliacoes?: number | null;
    site_qualidade?: string;
    mensagem_template_id?: string | null;
    mensagem_variacao_idx?: number | null;
  },
  templates: MessageTemplate[],
  perfil: { meu_nome: string; meu_link: string }
): MensagemGerada {
  const template =
    templates.find((t) => t.id === lead.mensagem_template_id) ?? escolherTemplatePadrao(templates, lead.termo_busca ?? "");
  if (!template || template.variacoes.length === 0) {
    return {
      texto: montarMensagem(lead.nome, lead.site_qualidade === "fraca"),
      templateId: null,
      variacaoIdx: null,
    };
  }
  const idx = escolherVariacaoIdx(template.variacoes.length, lead.mensagem_variacao_idx);
  const dados = dadosDoLead(lead, perfil.meu_nome, perfil.meu_link);
  return { texto: renderizarTemplate(template.variacoes[idx]!, dados), templateId: template.id, variacaoIdx: idx };
}
