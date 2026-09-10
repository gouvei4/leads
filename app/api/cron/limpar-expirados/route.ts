import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/firebaseAdmin";
import { CLIENTES_COLLECTION } from "@/lib/clientes";
import { apagarDadosDoCliente } from "@/lib/limpeza";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Limpeza automática. O Vercel Cron chama isto 1x/dia (ver vercel.json) com o
 * header `Authorization: Bearer $CRON_SECRET`. Apaga os dados de trabalho de
 * todo cliente que passou dos 30 dias; o cadastro em `clientes` fica.
 */
async function handler(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  }

  const db = getDb();
  const agora = Date.now();
  const snap = await db.collection(CLIENTES_COLLECTION).get();

  const alvos = snap.docs.filter((d) => {
    const data = d.data();
    return (
      !data.dados_apagados_em &&
      typeof data.expira_em === "string" &&
      new Date(data.expira_em).getTime() <= agora
    );
  });

  const resultados: { cliente: string; apagados: number }[] = [];
  for (const d of alvos) {
    const apagados = await apagarDadosDoCliente(db, d.id);
    resultados.push({ cliente: d.id, apagados });
  }

  return NextResponse.json({ ok: true, processados: resultados.length, resultados });
}

export const GET = handler;
export const POST = handler;
