import type { Firestore } from "firebase-admin/firestore";

export interface Perfil {
  meu_nome: string;
  meu_link: string;
}

const DEFAULT_PERFIL: Perfil = { meu_nome: "", meu_link: "" };

export async function getPerfil(db: Firestore): Promise<Perfil> {
  const snap = await db.collection("config").doc("perfil").get();
  if (!snap.exists) return DEFAULT_PERFIL;
  const d = snap.data() as Partial<Perfil>;
  return { meu_nome: d.meu_nome ?? "", meu_link: d.meu_link ?? "" };
}
