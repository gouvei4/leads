import { NextRequest, NextResponse } from "next/server";

// Não intercepta assets estáticos do Next nem o ícone.
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg).*)"],
};

/**
 * Trava de acesso opcional via HTTP Basic. Ativa só quando APP_PASSWORD está
 * definido (na Vercel, p.ex.) — sem ela, o app fica aberto pra uso local.
 * Qualquer nome de usuário serve; o que vale é a senha.
 */
export function proxy(req: NextRequest) {
  const senha = process.env.APP_PASSWORD;
  if (!senha) return NextResponse.next();

  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Basic ")) {
    try {
      const decoded = atob(auth.slice(6));
      const pass = decoded.slice(decoded.indexOf(":") + 1);
      if (pass === senha) return NextResponse.next();
    } catch {
      // header malformado — cai no 401 abaixo
    }
  }

  return new NextResponse("Autenticação necessária.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Prospector", charset="UTF-8"' },
  });
}
