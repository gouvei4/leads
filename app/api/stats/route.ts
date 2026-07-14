import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/firebaseAdmin";
import { getStats } from "@/lib/leads";

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const projeto = new URL(request.url).searchParams.get("projeto")?.trim() ?? "";
    const stats = await getStats(db, projeto || undefined);
    return NextResponse.json(stats);
  } catch (err) {
    return NextResponse.json({ erro: (err as Error).message }, { status: 500 });
  }
}
