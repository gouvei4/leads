import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/firebaseAdmin";
import { getPerfil, salvarPerfil } from "@/lib/perfil";
import { clienteDaRequisicao } from "@/lib/tenant";

export async function GET(request: NextRequest) {
  const dono = clienteDaRequisicao(request);
  if (!dono) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });

  try {
    const db = getDb();
    const perfil = await getPerfil(db, dono);
    return NextResponse.json(perfil);
  } catch (err) {
    return NextResponse.json({ erro: (err as Error).message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const dono = clienteDaRequisicao(request);
  if (!dono) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });

  try {
    const data = await request.json();
    const updates: Record<string, string> = {};
    if ("meu_nome" in data) updates.meu_nome = String(data.meu_nome ?? "").trim();
    if ("meu_link" in data) updates.meu_link = String(data.meu_link ?? "").trim();

    const db = getDb();
    await salvarPerfil(db, dono, updates);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ erro: (err as Error).message }, { status: 500 });
  }
}
