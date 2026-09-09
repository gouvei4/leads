export const STATUS_OPTIONS = [
  "Novo",
  "Contatado",
  "Respondeu",
  "Negociando",
  "Cliente",
  "Recusado",
] as const;

export type StatusOption = (typeof STATUS_OPTIONS)[number];

/**
 * Fonte única das cores de status no lado JS (marcadores do Leaflet, dots do
 * Kanban, barras do Painel). Mantenha em sincronia com os tokens
 * `--color-status-*` em app/globals.css, que são a fonte pro Tailwind
 * (classes `bg-status-*`, `text-status-*`).
 */
export const STATUS_COLORS: Record<StatusOption, string> = {
  Novo: "#3B82F6",
  Contatado: "#0EA5A0",
  Respondeu: "#8B5CF6",
  Negociando: "#EC4899",
  Cliente: "#16A34A",
  Recusado: "#E0393B",
};

export type SiteQualidade = "ausente" | "fraca" | "ok";

export interface HistoricoEvento {
  tipo: "status" | "mensagem_copiada" | "whatsapp_aberto" | "nota" | "criacao";
  data: string;
  de?: string;
  para?: string;
  texto?: string;
}

export interface CnpjInfo {
  razao_social: string;
  porte: string;
  data_abertura: string;
  email: string;
  socios: string[];
}

export interface Tag {
  nome: string;
  cor: string;
}

export interface Lead {
  id: string;
  projeto_id: string;
  /** ID do Google Places — chave de dedupe pra leads vindos de busca. */
  place_id?: string;
  nome: string;
  telefone: string;
  endereco: string;
  cidade: string;
  bairro?: string;
  site: string;
  link_maps: string;
  termo_busca: string;
  status: string;
  ultimo_contato: string;
  observacoes: string;
  criado_em: string;
  lat?: number | null;
  lng?: number | null;
  rating?: number | null;
  avaliacoes?: number | null;
  instagram?: string | null;
  email?: string | null;
  site_qualidade?: SiteQualidade;
  site_https?: boolean | null;
  site_responsivo?: boolean | null;
  site_tempo_ms?: number | null;
  raio_busca_m?: number | null;
  busca_id?: string | null;

  mensagem_gerada?: string;
  mensagem_template_id?: string | null;
  mensagem_variacao_idx?: number | null;

  tags?: Tag[];
  cnpj?: string | null;
  cnpj_info?: CnpjInfo | null;
  follow_up?: string | null;
  historico?: HistoricoEvento[];
}

export interface Projeto {
  id: string;
  nome: string;
  criado_em: string;
}

export interface MessageTemplate {
  id: string;
  nome: string;
  nicho_padrao: string | null;
  variacoes: string[];
  criado_em: string;
}

export type BlacklistTipo = "telefone" | "cnpj";

export interface BlacklistEntry {
  id: string;
  tipo: BlacklistTipo;
  valor: string;
  motivo: string;
  criado_em: string;
}

export interface Busca {
  id: string;
  projeto_id: string;
  nicho: string;
  localizacao_texto: string;
  lat: number;
  lng: number;
  raio_m: number;
  criado_em: string;
  total_no_raio: number;
  sem_site: number;
  novos: number;
}
