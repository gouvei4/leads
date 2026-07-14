import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ tem_chave: Boolean(process.env.GOOGLE_PLACES_KEY) });
}
