"use client";

import styles from "./ThemeToggle.module.css";
import { SunIcon, MoonIcon } from "./icons";

const THEME_KEY = "prospector:theme";

export default function ThemeToggle() {
  function toggle() {
    const root = document.documentElement;
    const next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
    root.setAttribute("data-theme", next);
    localStorage.setItem(THEME_KEY, next);
  }

  return (
    <button type="button" className={styles.toggle} onClick={toggle} title="Alternar tema" aria-label="Alternar tema">
      <SunIcon className={styles.sun} />
      <MoonIcon className={styles.moon} />
    </button>
  );
}
