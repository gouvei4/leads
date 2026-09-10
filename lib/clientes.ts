import { createHash, randomBytes } from "node:crypto";
import type { Firestore } from "firebase-admin/firestore";
import type { Cliente, ClienteStatus } from "./types";

export const CLIENTES_COLLECTION = "clientes";
export const DIAS_VALIDADE = 30;

/** Token puro entregue ao cliente. ~32 chars, alta entropia. Só aparece 1x. */
export function gerarToken(): string {
  return randomBytes(24).toString("base64url");
}

/** O que fica no banco — nunca o token puro. */
export function hashToken(raw: string): string {
  return createHash("sha256").update(raw.trim()).digest("hex");
}

interface ClienteDoc {
  nome: string;
  email: string;
  whatsapp: string;
  empresa: string;
  observacoes: string;
  token_hash: string;
  token_prefixo: string;
  criado_em: string;
  expira_em: string;
  revogado_em: string | null;
  dados_apagados_em: string | null;
  ultimo_acesso_em: string | null;
}

export function statusCliente(
  c: Pick<ClienteDoc, "expira_em" | "revogado_em">,
  agora: number = Date.now()
): ClienteStatus {
  if (c.revogado_em) return "revogado";
  if (new Date(c.expira_em).getTime() <= agora) return "expirado";
  return "ativo";
}

function toCliente(id: string, d: ClienteDoc): Cliente {
  const { token_hash: _omit, ...resto } = d;
  void _omit;
  return { id, ...resto, status: statusCliente(d) };
}

export interface DadosNovoCliente {
  nome: string;
  email?: string;
  whatsapp?: string;
  empresa?: string;
  observacoes?: string;
}

export async function criarCliente(
  db: Firestore,
  dados: DadosNovoCliente
): Promise<{ cliente: Cliente; token: string }> {
  const token = gerarToken();
  const agora = new Date();
  const expira = new Date(agora.getTime() + DIAS_VALIDADE * 86_400_000);

  const doc: ClienteDoc = {
    nome: dados.nome.trim(),
    email: (dados.email ?? "").trim(),
    whatsapp: (dados.whatsapp ?? "").trim(),
    empresa: (dados.empresa ?? "").trim(),
    observacoes: (dados.observacoes ?? "").trim(),
    token_hash: hashToken(token),
    token_prefixo: token.slice(0, 6),
    criado_em: agora.toISOString(),
    expira_em: expira.toISOString(),
    revogado_em: null,
    dados_apagados_em: null,
    ultimo_acesso_em: null,
  };

  const ref = db.collection(CLIENTES_COLLECTION).doc();
  await ref.set(doc);
  return { cliente: toCliente(ref.id, doc), token };
}

export async function listarClientes(db: Firestore): Promise<Cliente[]> {
  const snap = await db.collection(CLIENTES_COLLECTION).get();
  return snap.docs
    .map((d) => toCliente(d.id, d.data() as ClienteDoc))
    .sort((a, b) => b.criado_em.localeCompare(a.criado_em));
}

export async function acharClientePorToken(
  db: Firestore,
  rawToken: string
): Promise<{ id: string; doc: ClienteDoc } | null> {
  const snap = await db
    .collection(CLIENTES_COLLECTION)
    .where("token_hash", "==", hashToken(rawToken))
    .limit(1)
    .get();
  if (snap.empty) return null;
  return { id: snap.docs[0]!.id, doc: snap.docs[0]!.data() as ClienteDoc };
}

export async function getClienteDoc(
  db: Firestore,
  id: string
): Promise<ClienteDoc | null> {
  const snap = await db.collection(CLIENTES_COLLECTION).doc(id).get();
  return snap.exists ? (snap.data() as ClienteDoc) : null;
}

export async function registrarAcesso(db: Firestore, id: string): Promise<void> {
  await db
    .collection(CLIENTES_COLLECTION)
    .doc(id)
    .set({ ultimo_acesso_em: new Date().toISOString() }, { merge: true });
}

export async function revogarCliente(db: Firestore, id: string): Promise<void> {
  await db
    .collection(CLIENTES_COLLECTION)
    .doc(id)
    .set({ revogado_em: new Date().toISOString() }, { merge: true });
}
