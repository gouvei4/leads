import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/firebaseAdmin";
import { PROJETOS_COLLECTION } from "@/lib/projetos";
import { LEADS_COLLECTION } from "@/lib/leads";
import { commitEmLotes } from "@/lib/firestoreBatch";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const data = await request.json();
    const nome = String(data.nome ?? "").trim();
    if (!nome) {
      return NextResponse.json({ erro: "Informe um nome para o projeto." }, { status: 400 });
    }

    const db = getDb();
    await db.collection(PROJETOS_COLLECTION).doc(id).set({ nome }, { merge: true });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ erro: (err as Error).message }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const db = getDb();

    // desvincula os leads desse projeto (nao apaga os leads, so tira a
    // associacao) — em lotes de 450 pra nao estourar o limite do batch
    const leadsDoProjeto = await db.collection(LEADS_COLLECTION).where("projeto_id", "==", id).get();
    await commitEmLotes(
      db,
      leadsDoProjeto.docs.map((doc) => ({ ref: doc.ref, data: { projeto_id: "" }, merge: true }))
    );

    await db.collection(PROJETOS_COLLECTION).doc(id).delete();
    return NextResponse.json({ ok: true, leadsDesvinculados: leadsDoProjeto.size });
  } catch (err) {
    return NextResponse.json({ erro: (err as Error).message }, { status: 500 });
  }
}
