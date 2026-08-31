import { NextRequest, NextResponse } from "next/server";
import { placeDetailsLocation } from "@/lib/places";

export async function GET(request: NextRequest) {
  const apiKey = process.env.GOOGLE_PLACES_KEY;
  if (!apiKey) {
    return NextResponse.json({ erro: "Configure GOOGLE_PLACES_KEY no arquivo .env.local." }, { status: 400 });
  }

  const placeId = new URL(request.url).searchParams.get("place_id")?.trim() ?? "";
  if (!placeId) return NextResponse.json({ erro: "place_id ausente" }, { status: 400 });

  const loc = await placeDetailsLocation(placeId, apiKey);
  if (!loc) return NextResponse.json({ erro: "Não encontrado" }, { status: 404 });

  return NextResponse.json(loc);
}
