import type { Firestore } from "firebase-admin/firestore";
import type { Busca } from "./types";

export const BUSCAS_COLLECTION = "buscas";

export async function getBuscas(
  db: Firestore,
  dono: string,
  projetoId?: string
): Promise<Busca[]> {
  const snap = await db.collection(BUSCAS_COLLECTION).where("dono", "==", dono).get();
  let buscas = snap.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Omit<Busca, "id">) }));
  if (projetoId) buscas = buscas.filter((b) => b.projeto_id === projetoId);
  buscas.sort((a, b) => b.criado_em.localeCompare(a.criado_em));
  return buscas;
}
