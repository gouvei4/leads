import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Cookies de sessão assinados (HMAC-SHA256) — sem dependência de JWT. O payload
 * vai em claro (base64url), o que importa é a assinatura: o frontend não
 * consegue forjar nem editar `cid`/`exp`. A validação de verdade (revogação,
 * existência do cliente) é feita contra o Firestore no proxy.ts.
 */

export const COOKIE_SESSAO = "leads_sessao";
export const COOKIE_ADMIN = "leads_admin";

export interface SessaoCliente {
  tipo: "cliente";
  /** id do doc em `clientes` — é o `dono` de todos os dados do workspace */
  cid: string;
  /** epoch em segundos; igual à expiração real do token */
  exp: number;
}

export interface SessaoAdmin {
  tipo: "admin";
  /** id do doc em `admins` */
  aid: string;
  exp: number;
}

type Payload = SessaoCliente | SessaoAdmin;

function segredo(): string {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) {
    throw new Error(
      "AUTH_SECRET não configurado (mínimo 16 caracteres). Veja .env.local.example."
    );
  }
  return s;
}

function b64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

function assinaturaDe(corpo: string): string {
  return b64url(createHmac("sha256", segredo()).update(corpo).digest());
}

export function assinar(payload: Payload): string {
  const corpo = b64url(JSON.stringify(payload));
  return `${corpo}.${assinaturaDe(corpo)}`;
}

/**
 * Verifica assinatura e expiração. Retorna null pra qualquer coisa inválida
 * (incluindo AUTH_SECRET ausente) — nunca lança.
 */
export function verificar<T extends Payload = Payload>(token: string | undefined | null): T | null {
  if (!token) return null;
  const partes = token.split(".");
  if (partes.length !== 2) return null;
  const [corpo, assinatura] = partes;

  let esperada: string;
  try {
    esperada = assinaturaDe(corpo);
  } catch {
    return null;
  }

  const a = Buffer.from(assinatura);
  const b = Buffer.from(esperada);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  let payload: Payload;
  try {
    payload = JSON.parse(Buffer.from(corpo, "base64url").toString("utf8"));
  } catch {
    return null;
  }

  if (typeof payload.exp !== "number" || payload.exp * 1000 <= Date.now()) return null;
  return payload as T;
}

/** Opções padrão do cookie. `maxAgeSeg` <= 0 remove o cookie. */
export function opcoesCookie(maxAgeSeg: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: Math.max(0, Math.floor(maxAgeSeg)),
  };
}
