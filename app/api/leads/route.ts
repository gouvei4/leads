import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/firebaseAdmin";
import { getLeads } from "@/lib/leads";
import { clienteDaRequisicao } from "@/lib/tenant";
import { STATUS_OPTIONS } from "@/lib/types";

export async function GET(request: NextRequest) {
  const dono = clienteDaRequisicao(request);
  if (!dono) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });

  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const projeto = searchParams.get("projeto")?.trim() ?? "";
    const cidade = searchParams.get("cidade")?.trim() ?? "";
    const status = searchParams.get("status")?.trim() ?? "";
    const termo = searchParams.get("termo")?.trim() ?? "";
    const busca = searchParams.get("q")?.trim().toLowerCase() ?? "";

    if (!projeto) {
      return NextResponse.json({ leads: [], cidades: [], termos: [], status_options: STATUS_OPTIONS });
    }

    const doProjeto = await getLeads(db, dono, projeto);

    const leads = doProjeto.filter((l) => {
      if (cidade && l.cidade !== cidade) return false;
      if (status && l.status !== status) return false;
      if (termo && l.termo_busca !== termo) return false;
      if (busca) {
        const alvo = `${l.nome} ${l.endereco}`.toLowerCase();
        if (!alvo.includes(busca)) return false;
      }
      return true;
    });

    const cidades = [...new Set(doProjeto.map((l) => l.cidade).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b, "pt-BR")
    );
    const termos = [...new Set(doProjeto.map((l) => l.termo_busca).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b, "pt-BR")
    );

    return NextResponse.json({ leads, cidades, termos, status_options: STATUS_OPTIONS });
  } catch (err) {
    return NextResponse.json({ erro: (err as Error).message }, { status: 500 });
  }
}
