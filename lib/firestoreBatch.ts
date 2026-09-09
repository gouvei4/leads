import type { DocumentReference, Firestore } from "firebase-admin/firestore";

// O limite de operações por batch do Firestore é 500 — 450 deixa folga.
const MAX_OPS = 450;

export interface EscritaSet {
  ref: DocumentReference;
  data: Record<string, unknown>;
  /** true = mescla nos campos existentes; false/omitido = substitui o doc. */
  merge?: boolean;
}

/**
 * Aplica um monte de `.set()` em lotes (batches) em vez de uma requisição por
 * documento: menos round-trips e cada lote é atômico. Quebra automaticamente
 * quando passa de 450 operações (limite do Firestore é 500).
 */
export async function commitEmLotes(db: Firestore, escritas: EscritaSet[]): Promise<void> {
  for (let i = 0; i < escritas.length; i += MAX_OPS) {
    const batch = db.batch();
    for (const e of escritas.slice(i, i + MAX_OPS)) {
      if (e.merge) batch.set(e.ref, e.data, { merge: true });
      else batch.set(e.ref, e.data);
    }
    await batch.commit();
  }
}
