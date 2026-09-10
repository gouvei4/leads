import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/firebaseAdmin";
import { BLACKLIST_COLLECTION } from "@/lib/blacklist";
import { clienteDaRequisicao } from "@/lib/tenant";

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const dono = clienteDaRequisicao(request);
  if (!dono) return NextResponse.json({ ok: false, erro: "Não autenticado." }, { status: 401 });

  const { id } = await params;
  try {
    const db = getDb();
    const ref = db.collection(BLACKLIST_COLLECTION).doc(id);
    const atual = await ref.get();
    if (!atual.exists || atual.data()?.dono !== dono) {
      return NextResponse.json({ ok: false, erro: "Item não encontrado." }, { status: 404 });
    }
    await ref.delete();
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, erro: (err as Error).message }, { status: 500 });
  }
}
