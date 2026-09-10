import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/firebaseAdmin";
import { autenticarAdmin } from "@/lib/admins";
import { assinar, opcoesCookie, COOKIE_ADMIN } from "@/lib/session";

export const dynamic = "force-dynamic";

const DURACAO_SEG = 12 * 60 * 60;

export async function POST(request: NextRequest) {
  let email = "";
  let senha = "";
  try {
    const body = await request.json();
    email = String(body?.email ?? "");
    senha = String(body?.senha ?? "");
  } catch {
    // corpo inválido — cai no 400 abaixo
  }

  if (!email.trim() || !senha) {
    return NextResponse.json({ erro: "Informe e-mail e senha." }, { status: 400 });
  }

  let db;
  try {
    db = getDb();
  } catch (err) {
    return NextResponse.json({ erro: (err as Error).message }, { status: 500 });
  }

  const admin = await autenticarAdmin(db, email, senha);
  if (!admin) {
    return NextResponse.json({ erro: "E-mail ou senha incorretos." }, { status: 401 });
  }

  const exp = Math.floor(Date.now() / 1000) + DURACAO_SEG;
  const valor = assinar({ tipo: "admin", aid: admin.id, exp });

  const res = NextResponse.json({ ok: true, nome: admin.nome });
  res.cookies.set(COOKIE_ADMIN, valor, opcoesCookie(DURACAO_SEG));
  return res;
}
