"use client";

import styles from "./Header.module.css";
import { BrandMarkIcon } from "./icons";
import type { TabId } from "./AppShell";

const TABS: { id: TabId; label: string }[] = [
  { id: "leads", label: "Leads" },
  { id: "buscar", label: "Buscar" },
  { id: "config", label: "Configurações" },
];

export default function Header({
  activeTab,
  onChangeTab,
}: {
  activeTab: TabId;
  onChangeTab: (tab: TabId) => void;
}) {
  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <div className={styles.brandMark}>
          <BrandMarkIcon />
        </div>
        <div className={styles.brandText}>
          <h1>Prospector de Leads</h1>
          <div className={styles.subtitle}>Busca, salva e organiza empresas para prospecção</div>
        </div>
      </div>
      <nav className={styles.nav}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`${styles.tabBtn} ${activeTab === tab.id ? styles.tabBtnActive : ""}`}
            onClick={() => onChangeTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </header>
  );
}
