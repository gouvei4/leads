import type { Firestore } from "firebase-admin/firestore";
import type { NextRequest } from "next/server";
import { conferirSenha } from "./senha";
import { verificar, COOKIE_ADMIN, type SessaoAdmin } from "./session";

export const ADMINS_COLLECTION = "admins";

export async function autenticarAdmin(
  db: Firestore,
  email: string,
  senha: string
): Promise<{ id: string; nome: string } | null> {
  const alvo = email.trim().toLowerCase();
  if (!alvo || !senha) return null;

  const snap = await db.collection(ADMINS_COLLECTION).where("email", "==", alvo).limit(1).get();
  if (snap.empty) return null;

  const d = snap.docs[0]!.data();
  if (!conferirSenha(senha, String(d.senha_hash ?? ""))) return null;

  return { id: snap.docs[0]!.id, nome: String(d.nome ?? d.email ?? alvo) };
}

/** id do admin logado, ou null. Só confere a assinatura do cookie (não bate no banco). */
export function adminDaRequisicao(req: NextRequest): string | null {
  const s = verificar<SessaoAdmin>(req.cookies.get(COOKIE_ADMIN)?.value);
  return s && s.tipo === "admin" ? s.aid : null;
}
