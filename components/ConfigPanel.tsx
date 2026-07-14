"use client";

import { useEffect, useState } from "react";
import styles from "./ConfigPanel.module.css";

export default function ConfigPanel({ active }: { active: boolean }) {
  const [temChave, setTemChave] = useState<boolean | null>(null);

  useEffect(() => {
    if (!active) return;
    fetch("/api/config")
      .then((r) => r.json())
      .then((d) => setTemChave(Boolean(d.tem_chave)));
  }, [active]);

  return (
    <div>
      <div className={styles.sectionHead}>
        <h2>Configurações</h2>
        <p>A chave da Google Places API é lida do arquivo .env.local, no servidor.</p>
      </div>
      <div className={styles.configBox}>
        <label className={styles.fieldLabel}>Chave da Google Places API</label>
        {temChave !== null && (
          <div className={`${styles.statusBadge} ${temChave ? styles.ok : styles.no}`}>
            <span className={styles.dot} />
            {temChave ? "chave configurada" : "nenhuma chave configurada"}
          </div>
        )}

        <ol className={styles.steps}>
          <li>
            Acesse <span className={styles.code}>console.cloud.google.com</span> e crie um projeto
          </li>
          <li>
            Ative a <span className={styles.code}>Places API (New)</span> em APIs e Serviços → Biblioteca
          </li>
          <li>Gere uma chave em Credenciais → Criar credenciais → Chave de API</li>
          <li>
            Cole a chave em <span className={styles.code}>GOOGLE_PLACES_KEY</span> no arquivo{" "}
            <span className={styles.code}>.env.local</span> na raiz do projeto
          </li>
          <li>
            Reinicie o servidor (<span className={styles.code}>npm run dev</span>) para aplicar
          </li>
        </ol>
      </div>
    </div>
  );
}
