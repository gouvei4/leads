import type { Firestore } from "firebase-admin/firestore";
import { normalizarTelefoneBr } from "./whatsapp";
import type { BlacklistEntry } from "./types";

export const BLACKLIST_COLLECTION = "blacklist";

/** id determinístico por cliente — evita colisão entre workspaces. */
export function blacklistDocId(dono: string, tipo: string, valor: string): string {
  return `${dono}__${tipo}_${valor}`;
}

export async function getTelefonesBloqueados(db: Firestore, dono: string): Promise<Set<string>> {
  const snap = await db.collection(BLACKLIST_COLLECTION).where("dono", "==", dono).get();
  return new Set(
    snap.docs.filter((d) => d.data().tipo === "telefone").map((d) => d.data().valor as string)
  );
}

export async function getBlacklist(db: Firestore, dono: string): Promise<BlacklistEntry[]> {
  const snap = await db.collection(BLACKLIST_COLLECTION).where("dono", "==", dono).get();
  const itens = snap.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Omit<BlacklistEntry, "id">) }));
  itens.sort((a, b) => b.criado_em.localeCompare(a.criado_em));
  return itens;
}

export async function bloquearTelefone(
  db: Firestore,
  dono: string,
  telefone: string,
  motivo: string
): Promise<boolean> {
  const normalizado = normalizarTelefoneBr(telefone);
  if (!normalizado) return false;
  await db
    .collection(BLACKLIST_COLLECTION)
    .doc(blacklistDocId(dono, "telefone", normalizado))
    .set({ dono, tipo: "telefone", valor: normalizado, motivo, criado_em: new Date().toISOString() });
  return true;
}
