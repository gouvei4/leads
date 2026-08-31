import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/firebaseAdmin";
import { getBlacklist, BLACKLIST_COLLECTION } from "@/lib/blacklist";
import { normalizarTelefoneBr } from "@/lib/whatsapp";

export async function GET() {
  try {
    const db = getDb();
    const itens = await getBlacklist(db);
    return NextResponse.json({ itens });
  } catch (err) {
    return NextResponse.json({ erro: (err as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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

    const id = `${tipo}_${valor}`;
    await db
      .collection(BLACKLIST_COLLECTION)
      .doc(id)
      .set({ tipo, valor, motivo, criado_em: new Date().toISOString() });

    return NextResponse.json({ ok: true, id });
  } catch (err) {
    return NextResponse.json({ erro: (err as Error).message }, { status: 500 });
  }
}
