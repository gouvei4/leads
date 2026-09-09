"use client";

import { useEffect, useState } from "react";
import { useMensagemContext } from "./MensagemContext";

export default function ConfigView() {
  const { perfil, temChaveGoogle, salvarPerfil } = useMensagemContext();
  const [meuNome, setMeuNome] = useState(perfil.meu_nome);
  const [meuLink, setMeuLink] = useState(perfil.meu_link);
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza o formulário quando o perfil chega do servidor
    setMeuNome(perfil.meu_nome);
    setMeuLink(perfil.meu_link);
  }, [perfil]);

  async function salvar() {
    setSalvando(true);
    setSalvo(false);
    try {
      await salvarPerfil({ meu_nome: meuNome.trim(), meu_link: meuLink.trim() });
      setSalvo(true);
      setTimeout(() => setSalvo(false), 2000);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h2 className="text-lg font-bold text-ink">Configurações</h2>

      <section className="mt-5 rounded-card border border-line bg-surface p-4">
        <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Google Places API</span>
        <div className="mt-2 flex items-center gap-2 text-sm">
          <span
            className={`h-2 w-2 rounded-full ${
              temChaveGoogle == null
                ? "bg-ink-muted"
                : temChaveGoogle
                  ? "bg-status-cliente"
                  : "bg-status-recusado"
            }`}
          />
          <span className="text-ink">
            {temChaveGoogle == null
              ? "verificando..."
              : temChaveGoogle
                ? "chave configurada"
                : "nenhuma chave configurada"}
          </span>
        </div>
        <p className="mt-3 text-xs text-ink-muted">
          A chave (<code className="rounded bg-surface-2 px-1 py-0.5">GOOGLE_PLACES_KEY</code>) é lida do{" "}
          <code className="rounded bg-surface-2 px-1 py-0.5">.env.local</code> no servidor — não é editável por aqui.
          Passo a passo no README.
        </p>
      </section>

      <section className="mt-4 rounded-card border border-line bg-surface p-4">
        <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
          Seu perfil — usado nas mensagens ({"{{meu_nome}}"} / {"{{meu_link}}"})
        </span>
        <div className="mt-3 grid max-w-md gap-3">
          <input
            value={meuNome}
            onChange={(e) => setMeuNome(e.target.value)}
            placeholder="Seu nome"
            className="w-full rounded-control border border-line bg-surface-2 px-3 py-2 text-sm text-ink focus:border-primary focus:outline-none"
          />
          <input
            value={meuLink}
            onChange={(e) => setMeuLink(e.target.value)}
            placeholder="Seu link (portfólio, site, Instagram...)"
            className="w-full rounded-control border border-line bg-surface-2 px-3 py-2 text-sm text-ink focus:border-primary focus:outline-none"
          />
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={salvar}
              disabled={salvando}
              className="btn-primary rounded-control px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed"
            >
              {salvando ? "Salvando..." : "Salvar"}
            </button>
            {salvo && <span className="text-xs font-medium text-status-cliente">Salvo!</span>}
          </div>
        </div>
      </section>
    </div>
  );
}
