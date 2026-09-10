import type { Firestore } from "firebase-admin/firestore";
import type { Busca } from "./types";

export const BUSCAS_COLLECTION = "buscas";

export async function getBuscas(
  db: Firestore,
  dono: string,
  projetoId?: string
): Promise<Busca[]> {
  // Evita ler o histórico de todos os projetos para exibir somente o atual.
  let query = db.collection(BUSCAS_COLLECTION).where("dono", "==", dono);
  if (projetoId) query = query.where("projeto_id", "==", projetoId);
  const snap = await query.get();
  const buscas = snap.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Omit<Busca, "id">) }));
  buscas.sort((a, b) => b.criado_em.localeCompare(a.criado_em));
  return buscas;
}
