import { createHash } from "node:crypto";
import type { Firestore } from "firebase-admin/firestore";
import type { Lead } from "./types";

export const LEADS_COLLECTION = "leads";

/**
 * ID determinístico do lead dentro de um projeto, usado para dedupe. A mesma
 * empresa pode existir em projetos diferentes (cada um tem sua prospecção).
 *
 * Quando temos o place_id do Google (buscas novas), ele é a chave — é estável
 * entre buscas. O Google às vezes devolve `formattedAddress` ligeiramente
 * diferente pro mesmo lugar, então cair só em nome+endereço gerava duplicados.
 * Sem place_id (imports de planilha antiga), usa nome+endereço.
 */
export function leadDocId(
  dono: string,
  projetoId: string,
  nome: string,
  endereco: string,
  placeId?: string
): string {
  const key = placeId
    ? `${dono}|${projetoId}|place:${placeId}`
    : `${dono}|${projetoId}|${nome.trim().toLowerCase()}|${endereco.trim().toLowerCase()}`;
  return createHash("sha1").update(key).digest("hex");
}

export async function getLeads(
  db: Firestore,
  dono: string,
  projetoId?: string
): Promise<Lead[]> {
  // Quando há projeto selecionado, deixe o Firestore reduzir o conjunto antes
  // de transferi-lo para a função. Antes todos os leads do workspace eram
  // lidos e o filtro de projeto acontecia em memória.
  let query = db.collection(LEADS_COLLECTION).where("dono", "==", dono);
  if (projetoId) query = query.where("projeto_id", "==", projetoId);

  const snap = await query.get();
  const leads = snap.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<Lead, "id">),
  }));
  leads.sort((a, b) => {
    const porCidade = a.cidade.localeCompare(b.cidade, "pt-BR");
    if (porCidade !== 0) return porCidade;
    return a.nome.localeCompare(b.nome, "pt-BR");
  });
  return leads;
}
