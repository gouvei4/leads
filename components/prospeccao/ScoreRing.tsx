"use client";

import { useState } from "react";
import { calcularScoreDetalhado, faixaScore } from "@/lib/score";
import type { Lead } from "@/lib/types";

const CORES: Record<string, string> = {
  baixo: "var(--color-score-baixo)",
  medio: "var(--color-score-medio)",
  alto: "var(--color-score-alto)",
};

export default function ScoreRing({ lead, size = 40 }: { lead: Lead; size?: number }) {
  const [hover, setHover] = useState(false);
  const { total: score, fatores } = calcularScoreDetalhado(lead);
  const stroke = 3.5;
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const dash = (Math.max(0, Math.min(100, score)) / 100) * circ;
  const cor = CORES[faixaScore(score)];

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
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

      {hover && (
        <div className="absolute left-1/2 top-full z-50 mt-2 w-60 -translate-x-1/2 rounded-control border border-line bg-surface p-3 text-xs shadow-2xl">
          <div className="mb-1.5 font-semibold text-ink">Score: {score}/100</div>
          <ul className="space-y-1">
            {fatores.map((f, i) => (
              <li
                key={i}
                className={`flex items-center justify-between gap-2 ${
                  f.ativo ? "text-ink" : "text-ink-muted/60 line-through"
                }`}
              >
                <span>{f.label}</span>
                {f.ativo && <span className="shrink-0 font-semibold text-primary">+{f.pontos}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
