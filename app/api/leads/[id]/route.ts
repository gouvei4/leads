import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getDb } from "@/lib/firebaseAdmin";
import { LEADS_COLLECTION } from "@/lib/leads";
import { bloquearTelefone } from "@/lib/blacklist";
import type { HistoricoEvento } from "@/lib/types";

const CAMPOS_PERMITIDOS = [
  "status",
  "ultimo_contato",
  "observacoes",
  "mensagem_gerada",
  "mensagem_template_id",
  "mensagem_variacao_idx",
  "tags",
  "cnpj",
  "cnpj_info",
  "follow_up",
] as const;

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const data = await request.json();
    const updates: Record<string, unknown> = {};
    for (const campo of CAMPOS_PERMITIDOS) {
      if (campo in data) updates[campo] = data[campo];
    }

    const evento = data.evento as HistoricoEvento | undefined;
    if (evento) updates.historico = FieldValue.arrayUnion(evento);

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ ok: false, erro: "nada para atualizar" }, { status: 400 });
    }

    const db = getDb();
    const ref = db.collection(LEADS_COLLECTION).doc(id);
    await ref.set(updates, { merge: true });

    // lead marcado como Recusado entra na blacklist automaticamente, pra não
    // reaparecer em buscas futuras (em qualquer projeto)
    if (data.status === "Recusado") {
      const snap = await ref.get();
      await bloquearTelefone(db, String(snap.data()?.telefone ?? ""), "Lead marcado como Recusado");
    }

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
