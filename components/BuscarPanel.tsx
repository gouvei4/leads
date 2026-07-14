"use client";

import { useState } from "react";
import styles from "./BuscarPanel.module.css";
import formStyles from "./form.module.css";
import Button from "./Button";
import { SearchIcon } from "./icons";

interface BuscarSummary {
  novos: number;
  duplicados: number;
  erros: string[];
}

export default function BuscarPanel({ projetoId, projetoNome }: { projetoId: string; projetoNome: string }) {
  const [termos, setTermos] = useState("");
  const [cidades, setCidades] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [header, setHeader] = useState<string | null>(null);
  const [resultLines, setResultLines] = useState<string[]>([]);
  const [topError, setTopError] = useState<string | null>(null);
  const [summary, setSummary] = useState<BuscarSummary | null>(null);

  const listaTermos = termos.split("\n").map((s) => s.trim()).filter(Boolean);
  const listaCidades = cidades.split("\n").map((s) => s.trim()).filter(Boolean);
  const totalCombos = listaTermos.length * listaCidades.length;

  async function iniciarBusca() {
    if (!projetoId) {
      alert("Crie ou selecione um projeto antes de buscar.");
      return;
    }
    if (listaTermos.length === 0 || listaCidades.length === 0) {
      alert("Preencha pelo menos 1 termo e 1 cidade.");
      return;
    }

    setBuscando(true);
    setSummary(null);
    setResultLines([]);
    setTopError(null);
    setHeader(`Iniciando ${totalCombos} buscas...`);

    try {
      const r = await fetch("/api/buscar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projeto_id: projetoId, termos: listaTermos, cidades: listaCidades }),
      });

      const contentType = r.headers.get("content-type") ?? "";
      if (!contentType.includes("application/json")) {
        const texto = await r.text();
        throw new Error(
          `O servidor não respondeu em JSON (status ${r.status}). Provavelmente a busca ` +
            `demorou demais e a função expirou — tente com menos termos/cidades de uma vez. ` +
            `Detalhe: ${texto.slice(0, 150)}`
        );
      }

      const d = await r.json();
      if (!d.ok) {
        setTopError(`ERRO: ${d.erro}`);
      } else {
        setResultLines(d.log);
        setSummary({ novos: d.novos, duplicados: d.duplicados, erros: d.erros });
      }
    } catch (e) {
      setTopError(`ERRO de conexão: ${(e as Error).message}`);
    }
    setBuscando(false);
  }

  const mostrarLog = header !== null;

  return (
    <div>
      <div className={styles.sectionHead}>
        <h2>Buscar novas empresas</h2>
        <p>
          Combine termos e cidades para rodar buscas no Google Places de uma vez.
          {projetoNome && (
            <>
              {" "}
              Os resultados são salvos no projeto <strong>{projetoNome}</strong>.
            </>
          )}
        </p>
      </div>

      <div className={styles.buscaGrid}>
        <div className={styles.fieldCard}>
          <label className={styles.fieldLabel}>Termos de busca (1 por linha)</label>
          <textarea
            className={formStyles.textarea}
            value={termos}
            onChange={(e) => setTermos(e.target.value)}
            placeholder={"aluguel de cacamba\ndisk entulho\nreciclagem de sucata\nferro velho\ncooperativa de reciclagem"}
          />
          <div className={styles.hint}>Cada linha vira uma busca. Pode ser qualquer tipo de empresa.</div>
        </div>
        <div className={styles.fieldCard}>
          <label className={styles.fieldLabel}>Cidades (1 por linha)</label>
          <textarea
            className={formStyles.textarea}
            value={cidades}
            onChange={(e) => setCidades(e.target.value)}
            placeholder={"Campinas SP\nSao Paulo SP\nGuarulhos SP"}
          />
          <div className={styles.hint}>Nome da cidade + UF funciona melhor.</div>
        </div>
      </div>

      <div className={styles.actions}>
        <Button variant="primary" onClick={iniciarBusca} disabled={buscando || !projetoId}>
          <SearchIcon />
          {buscando ? "Buscando... pode levar alguns minutos" : "Iniciar busca"}
        </Button>
        {totalCombos > 0 && (
          <span className={styles.hint}>
            {totalCombos} buscas ({listaTermos.length} termos × {listaCidades.length} cidades)
          </span>
        )}
      </div>

      {summary && (
        <div className={styles.summary}>
          <div className={`${styles.summaryCard} ${styles.ok}`}>
            <span className={styles.summaryNum}>{summary.novos}</span>leads novos
          </div>
          <div className={`${styles.summaryCard} ${styles.dup}`}>
            <span className={styles.summaryNum}>{summary.duplicados}</span>já existiam
          </div>
          <div className={`${styles.summaryCard} ${styles.err}`}>
            <span className={styles.summaryNum}>{summary.erros.length}</span>erros
          </div>
        </div>
      )}

      {mostrarLog && (
        <div className={styles.log}>
          <div>{header}</div>
          {resultLines.map((linha, i) => (
            <div key={i} className={linha.startsWith("ERRO") ? styles.logErr : styles.logOk}>
              {linha.startsWith("ERRO") ? "✗ " : "✓ "}
              {linha}
            </div>
          ))}
          {topError && <div>{topError}</div>}
        </div>
      )}
    </div>
  );
}
