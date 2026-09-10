import type { NextRequest } from "next/server";
import { getDb } from "./firebaseAdmin";
import { verificar, COOKIE_SESSAO, type SessaoCliente } from "./session";
import { CLIENTES_COLLECTION, statusCliente } from "./clientes";

/**
 * id do cliente (o `dono` de todos os dados do workspace), tirado do cookie de
 * sessão assinado. Só confere a assinatura — a checagem de revogação/expiração
 * contra o banco é feita em `clienteAtivo` (usada no proxy).
 */
export function clienteDaRequisicao(req: NextRequest): string | null {
  const s = verificar<SessaoCliente>(req.cookies.get(COOKIE_SESSAO)?.value);
  return s && s.tipo === "cliente" ? s.cid : null;
}

const cache = new Map<string, { ativo: boolean; ate: number }>();
const TTL_MS = 60_000;

/**
 * Confirma no Firestore que o cliente existe, não expirou e não foi revogado.
 * Cacheado ~60s por cliente — revogar/expirar passa a valer em no máximo 1 min,
 * em qualquer rota, com custo de leitura desprezível.
 */
export async function clienteAtivo(cid: string): Promise<boolean> {
  const agora = Date.now();
  const hit = cache.get(cid);
  if (hit && hit.ate > agora) return hit.ativo;

  let ativo = false;
  try {
    const snap = await getDb().collection(CLIENTES_COLLECTION).doc(cid).get();
    if (snap.exists) {
      const d = snap.data() as { expira_em: string; revogado_em: string | null };
      ativo = statusCliente(d, agora) === "ativo";
    }
  } catch {
    ativo = false;
  }

  cache.set(cid, { ativo, ate: agora + TTL_MS });
  return ativo;
}

/** Invalida o cache (após revogar um token pelo painel, p.ex.). */
export function limparCacheCliente(cid?: string): void {
  if (cid) cache.delete(cid);
  else cache.clear();
}
