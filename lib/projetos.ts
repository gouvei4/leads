import type { Firestore } from "firebase-admin/firestore";
import type { Projeto } from "./types";

export const PROJETOS_COLLECTION = "projetos";

export async function getAllProjetos(db: Firestore, dono: string): Promise<Projeto[]> {
  const snap = await db.collection(PROJETOS_COLLECTION).where("dono", "==", dono).get();
  const projetos = snap.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<Projeto, "id">),
  }));
  projetos.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  return projetos;
}
