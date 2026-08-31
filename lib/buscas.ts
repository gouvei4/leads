import type { Firestore } from "firebase-admin/firestore";
import type { Busca } from "./types";

export const BUSCAS_COLLECTION = "buscas";

export async function getBuscas(db: Firestore, projetoId: string): Promise<Busca[]> {
  const snap = await db.collection(BUSCAS_COLLECTION).where("projeto_id", "==", projetoId).get();
  const buscas = snap.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Omit<Busca, "id">) }));
  buscas.sort((a, b) => b.criado_em.localeCompare(a.criado_em));
  return buscas;
}
