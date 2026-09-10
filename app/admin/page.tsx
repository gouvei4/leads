"use client";

import { useCallback, useEffect, useState } from "react";
import { BrandMarkIcon, CopyIcon, CheckIcon, TrashIcon } from "@/components/icons";
import type { Cliente } from "@/lib/types";

function fmtData(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("pt-BR");
}

const BADGE: Record<Cliente["status"], string> = {
  ativo: "bg-status-cliente/15 text-status-cliente",
  expirado: "bg-surface-2 text-ink-muted",
  revogado: "bg-status-recusado/15 text-status-recusado",
};

export default function AdminPage() {
  const [estado, setEstado] = useState<"carregando" | "login" | "ok">("carregando");
  const [clientes, setClientes] = useState<Cliente[]>([]);

  const carregar = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/clientes", { cache: "no-store" });
      if (r.status === 401) {
        setEstado("login");
        return;
      }
      const d = await r.json();
      setClientes(d.clientes ?? []);
      setEstado("ok");
    } catch {
      setEstado("login");
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carrega a lista de clientes ao montar
    carregar();
  }, [carregar]);

  if (estado === "carregando") {
    return (
      <div className="flex flex-1 items-center justify-center bg-bg">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-line border-t-primary" />
      </div>
    );
  }

  if (estado === "login") {
    return <LoginAdmin onOk={carregar} />;
  }

  return <PainelAdmin clientes={clientes} onMudou={carregar} />;
}

function LoginAdmin({ onOk }: { onOk: () => void }) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    if (carregando) return;
    setCarregando(true);
    setErro(null);
    try {
      const r = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        setErro(d.erro || "Não foi possível entrar.");
        return;
      }
      onOk();
    } catch {
      setErro("Erro de conexão.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-bg px-4 py-10 text-ink">
      <form onSubmit={entrar} className="w-full max-w-sm rounded-card border border-line bg-surface p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-control text-white"
            style={{
              backgroundImage:
                "linear-gradient(145deg, var(--color-primary-hover), var(--color-primary))",
            }}
          >
            <BrandMarkIcon className="h-5 w-5" />
          </div>
          <h1 className="text-base font-bold">Painel administrativo</h1>
        </div>

        <div className="grid gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="E-mail"
            autoComplete="username"
            className="w-full rounded-control border border-line bg-surface-2 px-3 py-2 text-sm text-ink focus:border-primary focus:outline-none"
          />
          <input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="Senha"
            autoComplete="current-password"
            className="w-full rounded-control border border-line bg-surface-2 px-3 py-2 text-sm text-ink focus:border-primary focus:outline-none"
          />
        </div>

        {erro && (
          <p className="mt-3 rounded-control bg-status-recusado/12 px-3 py-2 text-sm text-status-recusado">
            {erro}
          </p>
        )}

        <button
          type="submit"
          disabled={carregando || !email.trim() || !senha}
          className="btn-primary mt-4 w-full rounded-control px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed"
        >
          {carregando ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}

function PainelAdmin({ clientes, onMudou }: { clientes: Cliente[]; onMudou: () => void }) {
  const [form, setForm] = useState({ nome: "", email: "", whatsapp: "", empresa: "", observacoes: "" });
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [tokenGerado, setTokenGerado] = useState<{ token: string; cliente: Cliente } | null>(null);
  const [copiado, setCopiado] = useState(false);

  function set<K extends keyof typeof form>(campo: K, valor: string) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  async function gerar(e: React.FormEvent) {
    e.preventDefault();
    if (gerando || !form.nome.trim()) return;
    setGerando(true);
    setErro(null);
    setTokenGerado(null);
    try {
      const r = await fetch("/api/admin/clientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        setErro(d.erro || "Não foi possível gerar o token.");
        return;
      }
      setTokenGerado({ token: d.token, cliente: d.cliente });
      setForm({ nome: "", email: "", whatsapp: "", empresa: "", observacoes: "" });
      onMudou();
    } catch {
      setErro("Erro de conexão.");
    } finally {
      setGerando(false);
    }
  }

  async function copiar(texto: string) {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1800);
    } catch {
      /* ignora */
    }
  }

  async function revogar(id: string) {
    if (!confirm("Revogar este token? O acesso é bloqueado na hora; os dados só são apagados quando o token expira.")) return;
    await fetch(`/api/admin/clientes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ acao: "revogar" }),
    });
    onMudou();
  }

  async function excluir(id: string) {
    if (!confirm("Excluir este cliente e APAGAR todos os dados dele (leads, projetos, etc.)? Não dá pra desfazer.")) return;
    await fetch(`/api/admin/clientes/${id}`, { method: "DELETE" });
    onMudou();
  }

  async function sair() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.reload();
  }

  return (
    <div className="flex-1 overflow-y-auto bg-bg text-ink">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <header className="flex items-center justify-between">
          <h1 className="text-lg font-bold">Acessos por token</h1>
          <button
            type="button"
            onClick={sair}
            className="rounded-control border border-line px-3 py-1.5 text-sm text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink"
          >
            Sair
          </button>
        </header>

        <section className="mt-6 rounded-card border border-line bg-surface p-5">
          <h2 className="text-sm font-semibold">Gerar novo acesso</h2>
          <form onSubmit={gerar} className="mt-3 grid gap-3 sm:grid-cols-2">
            <input
              value={form.nome}
              onChange={(e) => set("nome", e.target.value)}
              placeholder="Nome do cliente *"
              className="w-full rounded-control border border-line bg-surface-2 px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
            <input
              value={form.empresa}
              onChange={(e) => set("empresa", e.target.value)}
              placeholder="Empresa / negócio"
              className="w-full rounded-control border border-line bg-surface-2 px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
            <input
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="E-mail"
              className="w-full rounded-control border border-line bg-surface-2 px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
            <input
              value={form.whatsapp}
              onChange={(e) => set("whatsapp", e.target.value)}
              placeholder="WhatsApp"
              className="w-full rounded-control border border-line bg-surface-2 px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
            <textarea
              value={form.observacoes}
              onChange={(e) => set("observacoes", e.target.value)}
              placeholder="Observações internas (só você vê)"
              rows={2}
              className="w-full rounded-control border border-line bg-surface-2 px-3 py-2 text-sm focus:border-primary focus:outline-none sm:col-span-2"
            />
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={gerando || !form.nome.trim()}
                className="btn-primary rounded-control px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed"
              >
                {gerando ? "Gerando..." : "Gerar token (30 dias)"}
              </button>
            </div>
          </form>

          {erro && (
            <p className="mt-3 rounded-control bg-status-recusado/12 px-3 py-2 text-sm text-status-recusado">
              {erro}
            </p>
          )}

          {tokenGerado && (
            <div className="mt-4 rounded-card border border-primary/40 bg-primary/8 p-4">
              <p className="text-sm font-semibold text-ink">
                Token de {tokenGerado.cliente.nome} — copie agora, ele não aparece de novo.
              </p>
              <div className="mt-2 flex items-center gap-2">
                <code className="flex-1 overflow-x-auto rounded-control bg-surface px-3 py-2 font-mono text-sm text-ink">
                  {tokenGerado.token}
                </code>
                <button
                  type="button"
                  onClick={() => copiar(tokenGerado.token)}
                  title="Copiar"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control border border-line text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink"
                >
                  {copiado ? <CheckIcon className="h-4 w-4 text-status-cliente" /> : <CopyIcon className="h-4 w-4" />}
                </button>
              </div>
              <p className="mt-2 text-xs text-ink-muted">
                Criado em {fmtData(tokenGerado.cliente.criado_em)} · expira em{" "}
                {fmtData(tokenGerado.cliente.expira_em)}
              </p>
            </div>
          )}
        </section>

        <section className="mt-6">
          <h2 className="text-sm font-semibold">Clientes ({clientes.length})</h2>
          {clientes.length === 0 ? (
            <p className="mt-3 text-sm text-ink-muted">Nenhum acesso gerado ainda.</p>
          ) : (
            <div className="mt-3 overflow-x-auto rounded-card border border-line">
              <table className="w-full text-left text-sm">
                <thead className="bg-surface-2 text-xs uppercase tracking-wide text-ink-muted">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Cliente</th>
                    <th className="px-3 py-2 font-semibold">Token</th>
                    <th className="px-3 py-2 font-semibold">Criado</th>
                    <th className="px-3 py-2 font-semibold">Expira</th>
                    <th className="px-3 py-2 font-semibold">Status</th>
                    <th className="px-3 py-2 font-semibold">Último acesso</th>
                    <th className="px-3 py-2 font-semibold">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {clientes.map((c) => (
                    <tr key={c.id} className="border-t border-line">
                      <td className="px-3 py-2">
                        <div className="font-medium text-ink">{c.nome}</div>
                        {(c.empresa || c.email) && (
                          <div className="text-xs text-ink-muted">
                            {[c.empresa, c.email].filter(Boolean).join(" · ")}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2 font-mono text-xs text-ink-muted">{c.token_prefixo}…</td>
                      <td className="px-3 py-2 text-ink-muted">{fmtData(c.criado_em)}</td>
                      <td className="px-3 py-2 text-ink-muted">{fmtData(c.expira_em)}</td>
                      <td className="px-3 py-2">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${BADGE[c.status]}`}>
                          {c.status}
                        </span>
                        {c.dados_apagados_em && (
                          <span className="ml-1 text-xs text-ink-muted" title={`dados apagados em ${fmtData(c.dados_apagados_em)}`}>
                            (dados apagados)
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-ink-muted">{fmtData(c.ultimo_acesso_em)}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1.5">
                          {c.status === "ativo" && (
                            <button
                              type="button"
                              onClick={() => revogar(c.id)}
                              className="rounded-control border border-line px-2 py-1 text-xs text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink"
                            >
                              Revogar
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => excluir(c.id)}
                            title="Excluir cliente e apagar dados"
                            className="flex h-7 w-7 items-center justify-center rounded-control border border-line text-ink-muted transition-colors hover:bg-status-recusado/12 hover:text-status-recusado"
                          >
                            <TrashIcon className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
