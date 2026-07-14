export const STATUS_OPTIONS = [
  "Novo",
  "Contatado",
  "Respondeu",
  "Negociando",
  "Cliente",
  "Sem interesse",
] as const;

export type StatusOption = (typeof STATUS_OPTIONS)[number];

export interface Lead {
  id: string;
  projeto_id: string;
  nome: string;
  telefone: string;
  endereco: string;
  cidade: string;
  site: string;
  link_maps: string;
  termo_busca: string;
  status: string;
  ultimo_contato: string;
  observacoes: string;
  criado_em: string;
}

export interface Projeto {
  id: string;
  nome: string;
  criado_em: string;
}

export interface Stats {
  total: number;
  por_status: Record<string, number>;
}

export interface LeadsResponse {
  leads: Lead[];
  cidades: string[];
  termos: string[];
  status_options: readonly string[];
}
