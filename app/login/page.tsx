"use client";

import { useState } from "react";
import { BrandMarkIcon } from "@/components/icons";

const MENSAGENS_ERRO: Record<string, string> = {
  expirado: "Sua sessão expirou. Insira o token novamente para continuar.",
  config: "O sistema ainda não foi configurado no servidor (AUTH_SECRET ausente).",
};

function erroInicial(): string | null {
  if (typeof window === "undefined") return null;
  const codigo = new URLSearchParams(window.location.search).get("erro");
  return codigo ? (MENSAGENS_ERRO[codigo] ?? null) : null;
}

export default function LoginPage() {
  const [token, setToken] = useState("");
  const [erro, setErro] = useState<string | null>(erroInicial);
  const [carregando, setCarregando] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    const limpo = token.trim();
    if (!limpo || carregando) return;

    setCarregando(true);
    setErro(null);
    try {
      const r = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: limpo }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        setErro(d.erro || "Não foi possível entrar. Confira o token e tente de novo.");
        return;
      }
      window.location.href = "/painel";
    } catch {
      setErro("Erro de conexão. Tente novamente em instantes.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-bg px-4 py-10 text-ink">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-card text-white"
            style={{
              backgroundImage:
                "linear-gradient(145deg, var(--color-primary-hover), var(--color-primary))",
            }}
          >
            <BrandMarkIcon className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold">Prospector — Leads</h1>
            <p className="mt-1 text-sm text-ink-muted">
              Insira o token de acesso que você recebeu.
            </p>
          </div>
        </div>

        <form
          onSubmit={entrar}
          className="rounded-card border border-line bg-surface p-5 shadow-sm"
        >
          <label htmlFor="token" className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Token de acesso
          </label>
          <input
            id="token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            autoFocus
            autoComplete="off"
            spellCheck={false}
            placeholder="cole aqui o token"
            className="mt-2 w-full rounded-control border border-line bg-surface-2 px-3 py-2.5 font-mono text-sm text-ink focus:border-primary focus:outline-none"
          />

          {erro && (
            <p className="mt-3 rounded-control bg-status-recusado/12 px-3 py-2 text-sm text-status-recusado">
              {erro}
            </p>
          )}

          <button
            type="submit"
            disabled={carregando || !token.trim()}
            className="btn-primary mt-4 w-full rounded-control px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed"
          >
            {carregando ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-ink-muted">
          Cada token vale por 30 dias. Sem um token válido, fale com o administrador.
        </p>
      </div>
    </div>
  );
}
