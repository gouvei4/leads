import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getDb } from "@/lib/firebaseAdmin";
import { LEADS_COLLECTION } from "@/lib/leads";
import { bloquearTelefone } from "@/lib/blacklist";
import { clienteDaRequisicao } from "@/lib/tenant";
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
  const dono = clienteDaRequisicao(request);
  if (!dono) return NextResponse.json({ ok: false, erro: "Não autenticado." }, { status: 401 });

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
    const atual = await ref.get();
    if (!atual.exists || atual.data()?.dono !== dono) {
      return NextResponse.json({ ok: false, erro: "Lead não encontrado." }, { status: 404 });
    }

    await ref.set(updates, { merge: true });

    // lead marcado como Recusado entra na blacklist automaticamente, pra não
    // reaparecer em buscas futuras (dentro do workspace deste cliente)
    if (data.status === "Recusado") {
      await bloquearTelefone(db, dono, String(atual.data()?.telefone ?? ""), "Lead marcado como Recusado");
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, erro: (err as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const dono = clienteDaRequisicao(request);
  if (!dono) return NextResponse.json({ ok: false, erro: "Não autenticado." }, { status: 401 });

  const { id } = await params;
  try {
    const db = getDb();
    const ref = db.collection(LEADS_COLLECTION).doc(id);
    const atual = await ref.get();
    if (!atual.exists || atual.data()?.dono !== dono) {
      return NextResponse.json({ ok: false, erro: "Lead não encontrado." }, { status: 404 });
    }
    await ref.delete();
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, erro: (err as Error).message }, { status: 500 });
  }
}
