import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/firebaseAdmin";
import { getAllProjetos, PROJETOS_COLLECTION } from "@/lib/projetos";
import { clienteDaRequisicao } from "@/lib/tenant";

export async function GET(request: NextRequest) {
  const dono = clienteDaRequisicao(request);
  if (!dono) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });

  try {
    const db = getDb();
    const projetos = await getAllProjetos(db, dono);
    return NextResponse.json({ projetos });
  } catch (err) {
    return NextResponse.json({ erro: (err as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const dono = clienteDaRequisicao(request);
  if (!dono) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });

  try {
    const data = await request.json();
    const nome = String(data.nome ?? "").trim();
    if (!nome) {
      return NextResponse.json({ erro: "Informe um nome para o projeto." }, { status: 400 });
    }

    const db = getDb();
    const ref = db.collection(PROJETOS_COLLECTION).doc();
    const projeto = { nome, dono, criado_em: new Date().toISOString() };
    await ref.set(projeto);

    return NextResponse.json({ id: ref.id, ...projeto });
  } catch (err) {
    return NextResponse.json({ erro: (err as Error).message }, { status: 500 });
  }
}
