import { NextRequest, NextResponse } from "next/server";
import { clienteDaRequisicao } from "@/lib/tenant";

export async function GET(request: NextRequest) {
  if (!clienteDaRequisicao(request)) {
    return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  }
  return NextResponse.json({ tem_chave: Boolean(process.env.GOOGLE_PLACES_KEY) });
}
