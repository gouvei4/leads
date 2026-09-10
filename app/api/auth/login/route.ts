import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/firebaseAdmin";
import { acharClientePorToken, registrarAcesso, statusCliente } from "@/lib/clientes";
import { assinar, opcoesCookie, COOKIE_SESSAO } from "@/lib/session";

export const dynamic = "force-dynamic";

const MSG_EXPIRADO =
  "Este token expirou. Entre em contato com o administrador para renovar seu acesso.";
const MSG_REVOGADO =
  "Este token foi revogado. Entre em contato com o administrador para renovar seu acesso.";

export async function POST(request: NextRequest) {
  let token = "";
  try {
    const body = await request.json();
    token = String(body?.token ?? "").trim();
  } catch {
    // corpo inválido — cai no "token inválido" abaixo
  }

  if (!token) {
    return NextResponse.json({ erro: "Informe o token de acesso." }, { status: 400 });
  }

  let db;
  try {
    db = getDb();
  } catch (err) {
    return NextResponse.json({ erro: (err as Error).message }, { status: 500 });
  }

  const achado = await acharClientePorToken(db, token);
  if (!achado) {
    return NextResponse.json({ erro: "Token inválido." }, { status: 401 });
  }

  const status = statusCliente(achado.doc);
  if (status === "revogado") {
    return NextResponse.json({ erro: MSG_REVOGADO, motivo: "revogado" }, { status: 401 });
  }
  if (status === "expirado") {
    return NextResponse.json({ erro: MSG_EXPIRADO, motivo: "expirado" }, { status: 401 });
  }

  const exp = Math.floor(new Date(achado.doc.expira_em).getTime() / 1000);
  const valor = assinar({ tipo: "cliente", cid: achado.id, exp });

  registrarAcesso(db, achado.id).catch(() => {});

  const res = NextResponse.json({ ok: true, expira_em: achado.doc.expira_em });
  res.cookies.set(COOKIE_SESSAO, valor, opcoesCookie(exp - Math.floor(Date.now() / 1000)));
  return res;
}
