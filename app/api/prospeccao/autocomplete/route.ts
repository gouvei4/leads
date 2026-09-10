import { NextRequest, NextResponse } from "next/server";
import { autocompleteLocation } from "@/lib/places";
import { clienteDaRequisicao } from "@/lib/tenant";

export async function GET(request: NextRequest) {
  if (!clienteDaRequisicao(request)) {
    return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  }

  const apiKey = process.env.GOOGLE_PLACES_KEY;
  if (!apiKey) {
    return NextResponse.json({ erro: "Configure GOOGLE_PLACES_KEY no arquivo .env.local." }, { status: 400 });
  }

  const input = new URL(request.url).searchParams.get("input")?.trim() ?? "";
  if (!input) return NextResponse.json({ sugestoes: [] });

  try {
    const sugestoes = await autocompleteLocation(input, apiKey);
    return NextResponse.json({ sugestoes });
  } catch (err) {
    return NextResponse.json({ erro: (err as Error).message }, { status: 502 });
  }
}
