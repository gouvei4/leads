import type { Firestore } from "firebase-admin/firestore";

export interface Perfil {
  meu_nome: string;
  meu_link: string;
}

/** Perfil por cliente: um doc por `dono` na coleção `perfis`. */
export const PERFIS_COLLECTION = "perfis";

const DEFAULT_PERFIL: Perfil = { meu_nome: "", meu_link: "" };

export async function getPerfil(db: Firestore, dono: string): Promise<Perfil> {
  const snap = await db.collection(PERFIS_COLLECTION).doc(dono).get();
  if (!snap.exists) return DEFAULT_PERFIL;
  const d = snap.data() as Partial<Perfil>;
  return { meu_nome: d.meu_nome ?? "", meu_link: d.meu_link ?? "" };
}

export async function salvarPerfil(
  db: Firestore,
  dono: string,
  updates: Partial<Perfil>
): Promise<void> {
  await db.collection(PERFIS_COLLECTION).doc(dono).set({ ...updates, dono }, { merge: true });
}
