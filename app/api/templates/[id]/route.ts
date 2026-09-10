import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/firebaseAdmin";
import { TEMPLATES_COLLECTION } from "@/lib/templates";
import { clienteDaRequisicao } from "@/lib/tenant";

async function templateDoDono(id: string, dono: string) {
  const db = getDb();
  const ref = db.collection(TEMPLATES_COLLECTION).doc(id);
  const snap = await ref.get();
  if (!snap.exists || snap.data()?.dono !== dono) return null;
  return ref;
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const dono = clienteDaRequisicao(request);
  if (!dono) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });

  const { id } = await params;
  try {
    const data = await request.json();
    const updates: Record<string, unknown> = {};

    if ("nome" in data) updates.nome = String(data.nome ?? "").trim();
    if ("nicho_padrao" in data) updates.nicho_padrao = data.nicho_padrao ? String(data.nicho_padrao).trim() : null;
    if ("variacoes" in data) {
      updates.variacoes = (data.variacoes ?? []).map((v: string) => v.trim()).filter(Boolean);
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ erro: "nada para atualizar" }, { status: 400 });
    }

    const ref = await templateDoDono(id, dono);
    if (!ref) return NextResponse.json({ erro: "Template não encontrado." }, { status: 404 });

    await ref.set(updates, { merge: true });
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
    const ref = await templateDoDono(id, dono);
    if (!ref) return NextResponse.json({ erro: "Template não encontrado." }, { status: 404 });

    await ref.delete();
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ erro: (err as Error).message }, { status: 500 });
  }
}
