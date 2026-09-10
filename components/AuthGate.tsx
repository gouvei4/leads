"use client";

import { useEffect } from "react";

/**
 * O acesso à página já é barrado pelo proxy.ts. Este componente só cuida do
 * caso "a sessão morreu com o app aberto": revalida periodicamente e no foco
 * da aba; se o token foi revogado ou passou dos 30 dias, manda pro /login.
 */
export default function AuthGate({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    let vivo = true;

    async function checar() {
      try {
        const r = await fetch("/api/auth/session", { cache: "no-store" });
        if (vivo && r.status === 401) {
          window.location.href = "/login?erro=expirado";
        }
      } catch {
        // rede indisponível — não desloga, tenta de novo no próximo ciclo
      }
    }

    checar();
    const intervalo = setInterval(checar, 5 * 60_000);
    const aoVoltar = () => {
      if (document.visibilityState === "visible") checar();
    };
    document.addEventListener("visibilitychange", aoVoltar);

    return () => {
      vivo = false;
      clearInterval(intervalo);
      document.removeEventListener("visibilitychange", aoVoltar);
    };
  }, []);

  return <>{children}</>;
}
