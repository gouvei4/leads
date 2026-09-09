"use client";

import { useEffect, useState } from "react";
import { SunIcon, MoonIcon } from "./icons";

const THEME_KEY = "prospector:theme";

function temaAtual(): "light" | "dark" {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
}

export default function ThemeToggle() {
  const [tema, setTema] = useState<"light" | "dark">(temaAtual);

  useEffect(() => {
    const obs = new MutationObserver(() => setTema(temaAtual()));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => obs.disconnect();
  }, []);

  function toggle() {
    const next = tema === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      /* ignora */
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      title="Alternar tema"
      aria-label="Alternar tema"
      className="inline-flex h-9 w-9 items-center justify-center rounded-control text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink"
    >
      {tema === "light" ? <MoonIcon className="h-4 w-4" /> : <SunIcon className="h-4 w-4" />}
    </button>
  );
}
