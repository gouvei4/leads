"use client";

import { useState } from "react";
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  DragOverlay,
  closestCenter,
} from "@dnd-kit/core";
import { STATUS_OPTIONS, STATUS_COLORS, type Lead } from "@/lib/types";
import { followUpVencido } from "@/lib/followup";
import ScoreRing from "./ScoreRing";
import { ClockIcon } from "../icons";

function KanbanCardConteudo({ lead }: { lead: Lead }) {
  return (
    <div className="flex items-center gap-2">
      <ScoreRing lead={lead} size={28} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1">
          <div className="truncate text-xs font-semibold text-ink">{lead.nome || "Sem nome"}</div>
          {followUpVencido(lead) && <ClockIcon className="h-3 w-3 shrink-0 text-status-negociando" />}
        </div>
        <div className="truncate text-[11px] text-ink-muted">{lead.cidade || lead.endereco}</div>
      </div>
    </div>
  );
}

function KanbanCard({ lead, onSelecionarLead }: { lead: Lead; onSelecionarLead: (l: Lead) => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: lead.id });
  const vencido = followUpVencido(lead);

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={() => onSelecionarLead(lead)}
      role="button"
      tabIndex={0}
      aria-label={`${lead.nome}, status ${lead.status}. Use as setas pra mover entre colunas.`}
      className={`cursor-grab rounded-control border p-2.5 text-left shadow-sm transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary active:cursor-grabbing ${
        vencido ? "border-status-negociando/60 bg-status-negociando/5" : "border-line bg-surface"
      } ${isDragging ? "opacity-30" : "hover:shadow-md"}`}
    >
      <KanbanCardConteudo lead={lead} />
    </div>
  );
}

function KanbanColunaSkeleton() {
  return (
    <div className="flex h-full w-72 shrink-0 animate-pulse flex-col rounded-card border border-line bg-surface-2/40">
      <div className="border-b border-line px-3 py-2.5">
        <div className="h-3 w-20 rounded bg-surface-2" />
      </div>
      <div className="flex-1 space-y-2 p-2">
        {[0, 1].map((i) => (
          <div key={i} className="h-14 rounded-control bg-surface-2" />
        ))}
      </div>
    </div>
  );
}

function KanbanColuna({
  status,
  leads,
  onSelecionarLead,
}: {
  status: string;
  leads: Lead[];
  onSelecionarLead: (l: Lead) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const cor = STATUS_COLORS[status as keyof typeof STATUS_COLORS] ?? "#64748B";

  return (
    <div className="flex h-full w-72 shrink-0 flex-col rounded-card border border-line bg-surface-2/40">
      <div className="flex items-center justify-between border-b border-line px-3 py-2.5">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: cor }} />
          <span className="text-xs font-semibold text-ink">{status}</span>
        </div>
        <span className="text-xs tabular-nums text-ink-muted">{leads.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className={`flex-1 space-y-2 overflow-y-auto p-2 transition-colors ${isOver ? "bg-primary/5" : ""}`}
      >
        {leads.length === 0 ? (
          <p className="px-2 py-6 text-center text-[11px] text-ink-muted/70">Nenhum lead</p>
        ) : (
          leads.map((lead) => <KanbanCard key={lead.id} lead={lead} onSelecionarLead={onSelecionarLead} />)
        )}
      </div>
    </div>
  );
}

export default function KanbanView({
  leads,
  loading,
  onUpdateStatus,
  onSelecionarLead,
}: {
  leads: Lead[];
  loading?: boolean;
  onUpdateStatus: (id: string, status: string) => void;
  onSelecionarLead: (lead: Lead) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );
  const [ativoId, setAtivoId] = useState<string | null>(null);
  const leadAtivo = leads.find((l) => l.id === ativoId) ?? null;

  function porStatus(status: string) {
    return leads.filter((l) => l.status === status);
  }

  if (loading) {
    return (
      <div className="flex h-full gap-3 overflow-x-auto p-4">
        {STATUS_OPTIONS.map((status) => (
          <KanbanColunaSkeleton key={status} />
        ))}
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={(e) => setAtivoId(String(e.active.id))}
      onDragEnd={(e) => {
        setAtivoId(null);
        const novoStatus = e.over?.id ? String(e.over.id) : null;
        if (!novoStatus) return;
        const lead = leads.find((l) => l.id === e.active.id);
        if (lead && lead.status !== novoStatus) onUpdateStatus(lead.id, novoStatus);
      }}
      onDragCancel={() => setAtivoId(null)}
    >
      <div className="flex h-full gap-3 overflow-x-auto p-4">
        {STATUS_OPTIONS.map((status) => (
          <KanbanColuna key={status} status={status} leads={porStatus(status)} onSelecionarLead={onSelecionarLead} />
        ))}
      </div>
      <DragOverlay>
        {leadAtivo && (
          <div className="w-64 rounded-control border border-primary bg-surface p-2.5 shadow-2xl">
            <KanbanCardConteudo lead={leadAtivo} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
