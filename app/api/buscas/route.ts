import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/firebaseAdmin";
import { getBuscas } from "@/lib/buscas";

export async function GET(request: NextRequest) {
  try {
    const projeto = new URL(request.url).searchParams.get("projeto")?.trim() ?? "";
    if (!projeto) return NextResponse.json({ buscas: [] });

    const db = getDb();
    const buscas = await getBuscas(db, projeto);
    return NextResponse.json({ buscas });
  } catch (err) {
    return NextResponse.json({ erro: (err as Error).message }, { status: 500 });
  }
}
