import type { HistoricoEvento } from "@/lib/types";

const LABELS: Record<HistoricoEvento["tipo"], (e: HistoricoEvento) => string> = {
  criacao: () => "Lead adicionado",
  status: (e) => `Status: ${e.de ?? "—"} → ${e.para}`,
  mensagem_copiada: () => "Mensagem copiada",
  whatsapp_aberto: () => "WhatsApp aberto",
  nota: (e) => (e.texto ? `Observação: "${e.texto.slice(0, 80)}${e.texto.length > 80 ? "…" : ""}"` : "Observação atualizada"),
  follow_up: (e) => (e.texto ? `Follow-up agendado para ${e.texto}` : "Follow-up atualizado"),
  resultado: (e) => (e.texto ? `Motivo do resultado: ${e.texto}` : "Resultado atualizado"),
  valor: (e) => (e.texto ? `Valor comercial: ${e.texto}` : "Valor comercial atualizado"),
};

function formatarData(iso: string): string {
  try {
    return new Date(iso).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default function HistoricoTimeline({ eventos }: { eventos: HistoricoEvento[] }) {
  const ordenados = [...eventos].sort((a, b) => b.data.localeCompare(a.data));

  if (ordenados.length === 0) {
    return <p className="text-xs text-ink-muted">Nenhum evento registrado ainda.</p>;
  }

  return (
    <ul className="max-h-48 space-y-2.5 overflow-y-auto pr-1">
      {ordenados.map((e, i) => (
        <li key={i} className="flex gap-2 text-xs">
          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
          <div className="min-w-0">
            <div className="text-ink">{(LABELS[e.tipo] ?? (() => e.tipo))(e)}</div>
            <div className="text-ink-muted">{formatarData(e.data)}</div>
          </div>
        </li>
      ))}
    </ul>
  );
}
