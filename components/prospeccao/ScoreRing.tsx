"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { calcularScoreDetalhado, faixaScore } from "@/lib/score";
import type { Lead } from "@/lib/types";

const CORES: Record<string, string> = {
  baixo: "var(--color-score-baixo)",
  medio: "var(--color-score-medio)",
  alto: "var(--color-score-alto)",
};

const VIEWPORT_PAD = 8;
const TRIGGER_GAP = 8;
const CLOSE_DELAY = 150;

type Pos = { top: number; left: number };

export default function ScoreRing({ lead, size = 40 }: { lead: Lead; size?: number }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<Pos | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<number | null>(null);
  const tooltipId = useId();

  const { total: score, fatores } = calcularScoreDetalhado(lead);
  const stroke = 3.5;
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const dash = (Math.max(0, Math.min(100, score)) / 100) * circ;
  const cor = CORES[faixaScore(score)];

  const cancelClose = useCallback(() => {
    if (closeTimer.current != null) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  const abrir = useCallback(() => {
    cancelClose();
    setOpen(true);
  }, [cancelClose]);

  const fechar = useCallback(() => {
    cancelClose();
    setOpen(false);
    setPos(null);
  }, [cancelClose]);

  const fecharComDelay = useCallback(() => {
    cancelClose();
    closeTimer.current = window.setTimeout(() => {
      setOpen(false);
      setPos(null);
    }, CLOSE_DELAY);
  }, [cancelClose]);

  useEffect(() => () => cancelClose(), [cancelClose]);

  // Calcula a posição do tooltip (position:fixed) a partir do rect do badge,
  // com detecção de colisão: vira pra cima se não couber embaixo (flip) e
  // prende as coordenadas dentro da viewport com 8px de folga (shift).
  const calcular = useCallback(() => {
    const trigger = triggerRef.current;
    const tip = tooltipRef.current;
    if (!trigger || !tip) return;

    const r = trigger.getBoundingClientRect();
    const tw = tip.offsetWidth;
    const th = tip.offsetHeight;
    const vw = document.documentElement.clientWidth;
    const vh = document.documentElement.clientHeight;

    let top = r.bottom + TRIGGER_GAP;
    const cabeAbaixo = top + th <= vh - VIEWPORT_PAD;
    const cabeAcima = r.top - TRIGGER_GAP - th >= VIEWPORT_PAD;
    if (!cabeAbaixo && cabeAcima) top = r.top - TRIGGER_GAP - th;
    top = Math.max(VIEWPORT_PAD, Math.min(top, vh - th - VIEWPORT_PAD));

    let left = r.left + r.width / 2 - tw / 2;
    left = Math.max(VIEWPORT_PAD, Math.min(left, vw - tw - VIEWPORT_PAD));

    setPos({ top: Math.round(top), left: Math.round(left) });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    calcular();
    window.addEventListener("scroll", calcular, true);
    window.addEventListener("resize", calcular);
    return () => {
      window.removeEventListener("scroll", calcular, true);
      window.removeEventListener("resize", calcular);
    };
  }, [open, calcular]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        setPos(null);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <div
      ref={triggerRef}
      className="relative shrink-0"
      style={{ width: size, height: size }}
      tabIndex={0}
      aria-describedby={open && pos ? tooltipId : undefined}
      onMouseEnter={abrir}
      onMouseLeave={fecharComDelay}
      onFocus={abrir}
      onBlur={fechar}
    >
      <svg width={size} height={size} className="-rotate-90" role="img" aria-label={`Score ${score} de 100`}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--color-line)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={cor}
          strokeWidth={stroke}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold tabular-nums text-ink">
        {score}
      </span>

      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={tooltipRef}
            id={tooltipId}
            role="tooltip"
            className="fixed z-[1100] w-max max-w-[320px] rounded-control border border-line bg-surface p-3 text-xs shadow-2xl"
            style={{
              top: pos?.top ?? 0,
              left: pos?.left ?? 0,
              opacity: pos ? 1 : 0,
              pointerEvents: pos ? "auto" : "none",
            }}
            onMouseEnter={cancelClose}
            onMouseLeave={fecharComDelay}
          >
            <div className="mb-1.5 font-semibold text-ink">Score: {score}/100</div>
            <ul className="space-y-1">
              {fatores.map((f, i) => (
                <li
                  key={i}
                  className={`flex items-start justify-between gap-2 ${
                    f.ativo ? "text-ink" : "text-ink-muted/60 line-through"
                  }`}
                >
                  <span className="min-w-0 flex-1 whitespace-normal break-words">{f.label}</span>
                  {f.ativo && <span className="shrink-0 font-semibold text-primary">+{f.pontos}</span>}
                </li>
              ))}
            </ul>
          </div>,
          document.body
        )}
    </div>
  );
}
