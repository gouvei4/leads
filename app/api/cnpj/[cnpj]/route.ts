import { NextRequest, NextResponse } from "next/server";
import { clienteDaRequisicao } from "@/lib/tenant";

interface BrasilApiQsa {
  nome_socio?: string;
}

interface BrasilApiCnpj {
  razao_social?: string;
  porte?: string;
  data_inicio_atividade?: string;
  email?: string;
  qsa?: BrasilApiQsa[];
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ cnpj: string }> }) {
  if (!clienteDaRequisicao(request)) {
    return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  }

  const { cnpj } = await params;
  const limpo = cnpj.replace(/\D/g, "");

  if (limpo.length !== 14) {
    return NextResponse.json({ erro: "CNPJ inválido — precisa ter 14 dígitos." }, { status: 400 });
  }

  try {
    const resp = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${limpo}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; BassaniLeadsBot/1.0)",
        Accept: "application/json",
      },
    });
    if (!resp.ok) {
      const erro = resp.status === 404 ? "CNPJ não encontrado." : `Erro ${resp.status} ao consultar a BrasilAPI.`;
      return NextResponse.json({ erro }, { status: resp.status === 404 ? 404 : 502 });
    }

    const data: BrasilApiCnpj = await resp.json();
    const info = {
      razao_social: data.razao_social ?? "",
      porte: data.porte ?? "",
      data_abertura: data.data_inicio_atividade ?? "",
      email: data.email ?? "",
      socios: (data.qsa ?? []).map((s) => s.nome_socio).filter((n): n is string => Boolean(n)),
    };

    return NextResponse.json({ ok: true, info });
  } catch (err) {
    return NextResponse.json({ erro: (err as Error).message }, { status: 502 });
  }
}
