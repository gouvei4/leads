import { NextRequest, NextResponse } from "next/server";
import { clienteDaRequisicao, clienteAtivo } from "@/lib/tenant";

export const dynamic = "force-dynamic";

/**
 * Revalidação leve, chamada periodicamente pelo AuthGate no cliente. Confere a
 * assinatura do cookie + o status do cliente no banco (cache de ~60s).
 */
export async function GET(request: NextRequest) {
  const cid = clienteDaRequisicao(request);
  if (!cid) {
    return NextResponse.json({ ok: false, motivo: "sem_sessao" }, { status: 401 });
  }

  const ativo = await clienteAtivo(cid);
  if (!ativo) {
    return NextResponse.json({ ok: false, motivo: "expirado" }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
