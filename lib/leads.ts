import { createHash } from "node:crypto";
import type { Firestore } from "firebase-admin/firestore";
import { STATUS_OPTIONS, type Lead, type Stats } from "./types";

export const LEADS_COLLECTION = "leads";

/**
 * ID determinístico (projeto + nome + endereço) usado para evitar leads
 * duplicados dentro do mesmo projeto. A mesma empresa pode existir em
 * projetos diferentes, já que cada um tem sua própria prospecção.
 */
export function leadDocId(projetoId: string, nome: string, endereco: string): string {
  const key = `${projetoId}|${nome.trim().toLowerCase()}|${endereco.trim().toLowerCase()}`;
  return createHash("sha1").update(key).digest("hex");
}

export async function getLeads(db: Firestore, projetoId?: string): Promise<Lead[]> {
  const query = projetoId
    ? db.collection(LEADS_COLLECTION).where("projeto_id", "==", projetoId)
    : db.collection(LEADS_COLLECTION);

  const snap = await query.get();
  const leads = snap.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<Lead, "id">),
  }));
  leads.sort((a, b) => {
    const porCidade = a.cidade.localeCompare(b.cidade, "pt-BR");
    if (porCidade !== 0) return porCidade;
    return a.nome.localeCompare(b.nome, "pt-BR");
  });
  return leads;
}

/**
 * Usa consultas de contagem (count aggregation) em vez de ler os documentos
 * inteiros — cada count() é cobrado/contabilizado como 1 leitura, não uma
 * por lead. Evita estourar a cota do Firestore ao atualizar a tela de stats
 * a cada edição de lead.
 */
export async function getStats(db: Firestore, projetoId?: string): Promise<Stats> {
  const base = projetoId
    ? db.collection(LEADS_COLLECTION).where("projeto_id", "==", projetoId)
    : db.collection(LEADS_COLLECTION);

  const [totalSnap, ...statusSnaps] = await Promise.all([
    base.count().get(),
    ...STATUS_OPTIONS.map((s) => base.where("status", "==", s).count().get()),
  ]);

  const por_status: Record<string, number> = {};
  STATUS_OPTIONS.forEach((s, i) => {
    por_status[s] = statusSnaps[i]!.data().count;
  });

  return { total: totalSnap.data().count, por_status };
}
