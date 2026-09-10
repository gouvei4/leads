import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/firebaseAdmin";
import { PROJETOS_COLLECTION } from "@/lib/projetos";
import { LEADS_COLLECTION } from "@/lib/leads";
import { commitEmLotes } from "@/lib/firestoreBatch";
import { clienteDaRequisicao } from "@/lib/tenant";
import type { DocumentReference } from "firebase-admin/firestore";

async function projetoDoDono(id: string, dono: string) {
  const db = getDb();
  const ref = db.collection(PROJETOS_COLLECTION).doc(id);
  const snap = await ref.get();
  if (!snap.exists || snap.data()?.dono !== dono) return null;
  return { db, ref };
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const dono = clienteDaRequisicao(request);
  if (!dono) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });

  const { id } = await params;
  try {
    const data = await request.json();
    const nome = String(data.nome ?? "").trim();
    if (!nome) {
      return NextResponse.json({ erro: "Informe um nome para o projeto." }, { status: 400 });
    }

    const alvo = await projetoDoDono(id, dono);
    if (!alvo) return NextResponse.json({ erro: "Projeto não encontrado." }, { status: 404 });

    await alvo.ref.set({ nome }, { merge: true });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ erro: (err as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const dono = clienteDaRequisicao(request);
  if (!dono) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });

  const { id } = await params;
  try {
    const alvo = await projetoDoDono(id, dono);
    if (!alvo) return NextResponse.json({ erro: "Projeto não encontrado." }, { status: 404 });
    const { db, ref } = alvo;

    // desvincula os leads desse projeto (nao apaga os leads, so tira a
    // associacao) — em lotes de 450 pra nao estourar o limite do batch.
    // O projeto já foi confirmado como deste cliente, então filtrar por
    // projeto_id basta (id de projeto é único entre workspaces).
    const leadsDoProjeto = await db.collection(LEADS_COLLECTION).where("projeto_id", "==", id).get();
    await commitEmLotes(
      db,
      leadsDoProjeto.docs.map((doc: { ref: DocumentReference }) => ({
        ref: doc.ref,
        data: { projeto_id: "" },
        merge: true,
      }))
    );

    await ref.delete();
    return NextResponse.json({ ok: true, leadsDesvinculados: leadsDoProjeto.size });
  } catch (err) {
    return NextResponse.json({ erro: (err as Error).message }, { status: 500 });
  }
}
