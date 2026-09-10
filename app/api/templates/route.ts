import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/firebaseAdmin";
import { getTemplates, TEMPLATES_COLLECTION } from "@/lib/templates";
import { clienteDaRequisicao } from "@/lib/tenant";

export async function GET(request: NextRequest) {
  const dono = clienteDaRequisicao(request);
  if (!dono) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });

  try {
    const db = getDb();
    const templates = await getTemplates(db, dono);
    return NextResponse.json({ templates });
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
    const variacoes: string[] = (data.variacoes ?? []).map((v: string) => v.trim()).filter(Boolean);
    const nichoPadrao = data.nicho_padrao ? String(data.nicho_padrao).trim() : null;

    if (!nome) return NextResponse.json({ erro: "Informe um nome para o template." }, { status: 400 });
    if (variacoes.length === 0) {
      return NextResponse.json({ erro: "Informe pelo menos uma variação de mensagem." }, { status: 400 });
    }

    const db = getDb();
    const ref = db.collection(TEMPLATES_COLLECTION).doc();
    const template = {
      nome,
      nicho_padrao: nichoPadrao,
      variacoes,
      dono,
      criado_em: new Date().toISOString(),
    };
    await ref.set(template);

    return NextResponse.json({ id: ref.id, ...template });
  } catch (err) {
    return NextResponse.json({ erro: (err as Error).message }, { status: 500 });
  }
}
