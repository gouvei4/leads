import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/firebaseAdmin";
import { adminDaRequisicao } from "@/lib/admins";
import { criarCliente, listarClientes } from "@/lib/clientes";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!adminDaRequisicao(request)) {
    return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  }
  try {
    const db = getDb();
    const clientes = await listarClientes(db);
    return NextResponse.json({ clientes });
  } catch (err) {
    return NextResponse.json({ erro: (err as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!adminDaRequisicao(request)) {
    return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  }
  try {
    const data = await request.json();
    const nome = String(data?.nome ?? "").trim();
    if (!nome) {
      return NextResponse.json({ erro: "Informe o nome do cliente." }, { status: 400 });
    }

    const db = getDb();
    const { cliente, token } = await criarCliente(db, {
      nome,
      email: String(data?.email ?? ""),
      whatsapp: String(data?.whatsapp ?? ""),
      empresa: String(data?.empresa ?? ""),
      observacoes: String(data?.observacoes ?? ""),
    });

    // `token` só é devolvido aqui, nesta resposta — nunca mais.
    return NextResponse.json({ cliente, token });
  } catch (err) {
    return NextResponse.json({ erro: (err as Error).message }, { status: 500 });
  }
}
