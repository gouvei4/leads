import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/firebaseAdmin";
import { getBlacklist, blacklistDocId, BLACKLIST_COLLECTION } from "@/lib/blacklist";
import { clienteDaRequisicao } from "@/lib/tenant";
import { normalizarTelefoneBr } from "@/lib/whatsapp";

export async function GET(request: NextRequest) {
  const dono = clienteDaRequisicao(request);
  if (!dono) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });

  try {
    const db = getDb();
    const itens = await getBlacklist(db, dono);
    return NextResponse.json({ itens });
  } catch (err) {
    return NextResponse.json({ erro: (err as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const dono = clienteDaRequisicao(request);
  if (!dono) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });

  try {
    const data = await request.json();
    const tipo = data.tipo === "cnpj" ? "cnpj" : "telefone";
    const motivo = String(data.motivo ?? "Bloqueado manualmente").trim();
    const db = getDb();

    let valor: string;
    if (tipo === "telefone") {
      const normalizado = normalizarTelefoneBr(String(data.valor ?? ""));
      if (!normalizado) return NextResponse.json({ erro: "Telefone inválido." }, { status: 400 });
      valor = normalizado;
    } else {
      valor = String(data.valor ?? "").replace(/\D/g, "");
      if (valor.length !== 14) return NextResponse.json({ erro: "CNPJ inválido." }, { status: 400 });
    }

    const id = blacklistDocId(dono, tipo, valor);
    await db
      .collection(BLACKLIST_COLLECTION)
      .doc(id)
      .set({ dono, tipo, valor, motivo, criado_em: new Date().toISOString() });

    return NextResponse.json({ ok: true, id });
  } catch (err) {
    return NextResponse.json({ erro: (err as Error).message }, { status: 500 });
  }
}
