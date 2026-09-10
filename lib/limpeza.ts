import type { Firestore } from "firebase-admin/firestore";
import { CLIENTES_COLLECTION } from "./clientes";
import { PERFIS_COLLECTION } from "./perfil";

/**
 * Coleções cujos documentos têm `dono` (= id do cliente). Quando o token
 * expira, tudo isso é apagado; o cadastro em `clientes` fica, marcado com
 * `dados_apagados_em`.
 */
const COLECOES_DE_DADOS = ["leads", "projetos", "templates", "buscas", "blacklist"] as const;
const PAGINA = 300;

async function apagarPorDono(db: Firestore, colecao: string, dono: string): Promise<number> {
  let total = 0;
  for (;;) {
    const snap = await db.collection(colecao).where("dono", "==", dono).limit(PAGINA).get();
    if (snap.empty) break;
    const batch = db.batch();
    snap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
    total += snap.size;
    if (snap.size < PAGINA) break;
  }
  return total;
}

/**
 * Apaga todos os dados de trabalho de um cliente. Não remove o doc em
 * `clientes` — só registra `dados_apagados_em`. Idempotente.
 */
export async function apagarDadosDoCliente(db: Firestore, clienteId: string): Promise<number> {
  let total = 0;
  for (const colecao of COLECOES_DE_DADOS) {
    total += await apagarPorDono(db, colecao, clienteId);
  }
  await db.collection(PERFIS_COLLECTION).doc(clienteId).delete().catch(() => {});
  await db
    .collection(CLIENTES_COLLECTION)
    .doc(clienteId)
    .set({ dados_apagados_em: new Date().toISOString() }, { merge: true });
  return total;
}
