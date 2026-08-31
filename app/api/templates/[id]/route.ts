import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/firebaseAdmin";
import { TEMPLATES_COLLECTION } from "@/lib/templates";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const db = getDb();
    await db.collection(TEMPLATES_COLLECTION).doc(id).set(updates, { merge: true });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ erro: (err as Error).message }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const db = getDb();
    await db.collection(TEMPLATES_COLLECTION).doc(id).delete();
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ erro: (err as Error).message }, { status: 500 });
  }
}
