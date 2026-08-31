import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/firebaseAdmin";
import { getStats } from "@/lib/leads";

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const projeto = new URL(request.url).searchParams.get("projeto")?.trim() ?? "";
    if (!projeto) {
      const por_status: Record<string, number> = {};
      return NextResponse.json({ total: 0, por_status });
    }
    const stats = await getStats(db, projeto);
    return NextResponse.json(stats);
  } catch (err) {
    return NextResponse.json({ erro: (err as Error).message }, { status: 500 });
  }
}
