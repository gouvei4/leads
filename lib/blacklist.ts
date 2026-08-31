import type { Firestore } from "firebase-admin/firestore";
import { normalizarTelefoneBr } from "./whatsapp";
import type { BlacklistEntry } from "./types";

export const BLACKLIST_COLLECTION = "blacklist";

export async function getTelefonesBloqueados(db: Firestore): Promise<Set<string>> {
  const snap = await db.collection(BLACKLIST_COLLECTION).where("tipo", "==", "telefone").get();
  return new Set(snap.docs.map((d) => d.data().valor as string));
}

export async function getBlacklist(db: Firestore): Promise<BlacklistEntry[]> {
  const snap = await db.collection(BLACKLIST_COLLECTION).get();
  const itens = snap.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Omit<BlacklistEntry, "id">) }));
  itens.sort((a, b) => b.criado_em.localeCompare(a.criado_em));
  return itens;
}

export async function bloquearTelefone(db: Firestore, telefone: string, motivo: string): Promise<boolean> {
  const normalizado = normalizarTelefoneBr(telefone);
  if (!normalizado) return false;
  await db
    .collection(BLACKLIST_COLLECTION)
    .doc(`telefone_${normalizado}`)
    .set({ tipo: "telefone", valor: normalizado, motivo, criado_em: new Date().toISOString() });
  return true;
}
