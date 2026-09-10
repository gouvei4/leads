import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/firebaseAdmin";
import { getBuscas } from "@/lib/buscas";
import { clienteDaRequisicao } from "@/lib/tenant";

export async function GET(request: NextRequest) {
  const dono = clienteDaRequisicao(request);
  if (!dono) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });

  try {
    const projeto = new URL(request.url).searchParams.get("projeto")?.trim() || undefined;
    const db = getDb();
    const buscas = await getBuscas(db, dono, projeto);
    return NextResponse.json({ buscas });
  } catch (err) {
    return NextResponse.json({ erro: (err as Error).message }, { status: 500 });
  }
}
