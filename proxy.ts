import { NextRequest, NextResponse } from "next/server";
import { verificar, COOKIE_SESSAO, type SessaoCliente } from "@/lib/session";
import { clienteAtivo } from "@/lib/tenant";

// Não intercepta assets estáticos do Next nem os arquivos públicos da landing page.
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|background.png).*)"],
};

/** Rotas que não exigem sessão de cliente (têm sua própria proteção, ou nenhuma). */
function ehPublica(pathname: string): boolean {
  return (
    pathname === "/" ||
    pathname === "/login" ||
    pathname.startsWith("/api/auth/") ||
    pathname === "/admin" ||
    pathname.startsWith("/api/admin/") || // protegido pelo cookie de admin no handler
    pathname.startsWith("/api/cron/") // protegido pelo CRON_SECRET no handler
  );
}

/**
 * Controle de acesso central. Roda no runtime Node.js (Next 16), então usa o
 * firebase-admin direto pra confirmar que o token/cliente ainda está ativo.
 */
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (ehPublica(pathname)) return NextResponse.next();

  const ehApi = pathname.startsWith("/api/");

  if (!process.env.AUTH_SECRET) {
    if (ehApi) {
      return NextResponse.json(
        { erro: "AUTH_SECRET não configurado no servidor." },
        { status: 503 }
      );
    }
    return NextResponse.redirect(new URL("/login?erro=config", req.url));
  }

  const sessao = verificar<SessaoCliente>(req.cookies.get(COOKIE_SESSAO)?.value);
  const cid = sessao && sessao.tipo === "cliente" ? sessao.cid : null;

  const liberado = cid ? await clienteAtivo(cid) : false;
  if (liberado) return NextResponse.next();

  if (ehApi) {
    return NextResponse.json({ erro: "Sessão inválida ou expirada." }, { status: 401 });
  }
  const destino = new URL("/login", req.url);
  if (cid) destino.searchParams.set("erro", "expirado");
  return NextResponse.redirect(destino);
}
