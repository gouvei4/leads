import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/firebaseAdmin";
import { getPerfil } from "@/lib/perfil";

export async function GET() {
  try {
    const db = getDb();
    const perfil = await getPerfil(db);
    return NextResponse.json(perfil);
  } catch (err) {
    return NextResponse.json({ erro: (err as Error).message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const data = await request.json();
    const updates: Record<string, unknown> = {};
    if ("meu_nome" in data) updates.meu_nome = String(data.meu_nome ?? "").trim();
    if ("meu_link" in data) updates.meu_link = String(data.meu_link ?? "").trim();

    const db = getDb();
    await db.collection("config").doc("perfil").set(updates, { merge: true });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ erro: (err as Error).message }, { status: 500 });
  }
}
