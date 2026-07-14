import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/firebaseAdmin";
import { LEADS_COLLECTION } from "@/lib/leads";

const CAMPOS_PERMITIDOS = ["status", "ultimo_contato", "observacoes"] as const;

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const data = await request.json();
    const updates: Record<string, unknown> = {};
    for (const campo of CAMPOS_PERMITIDOS) {
      if (campo in data) updates[campo] = data[campo];
    }
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ ok: false, erro: "nada para atualizar" }, { status: 400 });
    }

    const db = getDb();
    await db.collection(LEADS_COLLECTION).doc(id).set(updates, { merge: true });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, erro: (err as Error).message }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const db = getDb();
    await db.collection(LEADS_COLLECTION).doc(id).delete();
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, erro: (err as Error).message }, { status: 500 });
  }
}
