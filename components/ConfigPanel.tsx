"use client";

import { useEffect, useState } from "react";
import styles from "./ConfigPanel.module.css";
import formStyles from "./form.module.css";
import Button from "./Button";

export default function ConfigPanel({ active }: { active: boolean }) {
  const [temChave, setTemChave] = useState<boolean | null>(null);
  const [meuNome, setMeuNome] = useState("");
  const [meuLink, setMeuLink] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);

  useEffect(() => {
    if (!active) return;
    fetch("/api/config")
      .then((r) => r.json())
      .then((d) => setTemChave(Boolean(d.tem_chave)));
    fetch("/api/perfil")
      .then((r) => r.json())
      .then((d) => {
        setMeuNome(d.meu_nome ?? "");
        setMeuLink(d.meu_link ?? "");
      });
  }, [active]);

  async function salvarPerfil() {
    setSalvando(true);
    setSalvo(false);
    try {
      await fetch("/api/perfil", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meu_nome: meuNome, meu_link: meuLink }),
      });
      setSalvo(true);
      setTimeout(() => setSalvo(false), 2000);
    } finally {
      setSalvando(false);
    }
  }

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

      <div className={styles.configBox} style={{ marginTop: 32 }}>
        <label className={styles.fieldLabel}>Seu perfil (usado nas mensagens: {"{{meu_nome}}"} / {"{{meu_link}}"})</label>
        <div style={{ display: "grid", gap: 12, maxWidth: 420, marginTop: 8 }}>
          <input
            className={formStyles.input}
            placeholder="Seu nome"
            value={meuNome}
            onChange={(e) => setMeuNome(e.target.value)}
          />
          <input
            className={formStyles.input}
            placeholder="Seu link (portfólio, site, Instagram...)"
            value={meuLink}
            onChange={(e) => setMeuLink(e.target.value)}
          />
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Button variant="primary" onClick={salvarPerfil} disabled={salvando}>
              {salvando ? "Salvando..." : "Salvar"}
            </Button>
            {salvo && <span style={{ fontSize: 13, color: "var(--success)" }}>Salvo!</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
