import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/firebaseAdmin";
import { adminDaRequisicao } from "@/lib/admins";
import { CLIENTES_COLLECTION, revogarCliente } from "@/lib/clientes";
import { apagarDadosDoCliente } from "@/lib/limpeza";
import { limparCacheCliente } from "@/lib/tenant";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** PATCH { acao: "revogar" } — bloqueia o acesso, mantém os dados. */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!adminDaRequisicao(request)) {
    return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  }
  const { id } = await params;
  try {
    const data = await request.json().catch(() => ({}));
    if (data?.acao !== "revogar") {
      return NextResponse.json({ erro: "Ação inválida." }, { status: 400 });
    }
    const db = getDb();
    await revogarCliente(db, id);
    limparCacheCliente(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ erro: (err as Error).message }, { status: 500 });
  }
}

/** DELETE — apaga todos os dados do cliente E o cadastro dele. */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!adminDaRequisicao(request)) {
    return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  }
  const { id } = await params;
  try {
    const db = getDb();
    const apagados = await apagarDadosDoCliente(db, id);
    await db.collection(CLIENTES_COLLECTION).doc(id).delete();
    limparCacheCliente(id);
    return NextResponse.json({ ok: true, apagados });
  } catch (err) {
    return NextResponse.json({ erro: (err as Error).message }, { status: 500 });
  }
}
