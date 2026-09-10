import { NextResponse } from "next/server";
import { opcoesCookie, COOKIE_ADMIN } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_ADMIN, "", opcoesCookie(0));
  return res;
}
