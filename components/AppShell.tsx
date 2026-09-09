"use client";

import { useEffect, useState } from "react";
import { ProjetoProvider } from "./prospeccao/ProjetoContext";
import { MensagemProvider } from "./prospeccao/MensagemContext";
import { ToastProvider } from "./prospeccao/Toast";
import ProspeccaoShell from "./prospeccao/ProspeccaoShell";
import TemplatesView from "./prospeccao/TemplatesView";
import BlacklistView from "./prospeccao/BlacklistView";
import ConfigView from "./prospeccao/ConfigView";
import ThemeToggle from "./ThemeToggle";
import {
  BrandMarkIcon,
  TargetIcon,
  MessageSquareIcon,
  ShieldOffIcon,
  SettingsIcon,
  KeyboardIcon,
} from "./icons";

type Secao = "prospeccao" | "templates" | "blacklist" | "config";

const NAV: { id: Secao; label: string; Icon: typeof TargetIcon }[] = [
  { id: "prospeccao", label: "Prospecção", Icon: TargetIcon },
  { id: "templates", label: "Templates", Icon: MessageSquareIcon },
  { id: "blacklist", label: "Blacklist", Icon: ShieldOffIcon },
];

export default function AppShell() {
  const [secao, setSecao] = useState<Secao>("prospeccao");

  // ProspeccaoShell fica sempre montado (preserva leads carregados e o mapa).
  // Ao voltar pra ele, o container do Leaflet precisa remedir — o mapa escuta
  // o resize do window.
  useEffect(() => {
    if (secao === "prospeccao") {
      const t = setTimeout(() => window.dispatchEvent(new Event("resize")), 60);
      return () => clearTimeout(t);
    }
  }, [secao]);

  return (
    <ProjetoProvider>
      <MensagemProvider>
        <ToastProvider>
          <div className="flex h-full min-h-0 w-full bg-bg text-ink">
            <nav className="flex w-16 shrink-0 flex-col items-center gap-1.5 border-r border-line bg-surface py-3.5">
              <div
                className="mb-2 flex h-10 w-10 items-center justify-center rounded-card text-white"
                style={{
                  backgroundImage:
                    "linear-gradient(145deg, var(--color-primary-hover), var(--color-primary))",
                }}
              >
                <BrandMarkIcon className="h-[22px] w-[22px]" />
              </div>
              {NAV.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSecao(id)}
                  title={label}
                  aria-label={label}
                  aria-pressed={secao === id}
                  className={`flex h-11 w-11 items-center justify-center rounded-card transition-all ${
                    secao === id
                      ? "glow-primary bg-primary text-white"
                      : "text-ink-muted hover:bg-surface-2 hover:text-ink"
                  }`}
                >
                  <Icon className="h-[19px] w-[19px]" />
                </button>
              ))}

              <div className="mt-auto flex flex-col items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new CustomEvent("prospector:atalhos"))}
                  title="Atalhos de teclado (?)"
                  aria-label="Atalhos de teclado"
                  className="flex h-9 w-9 items-center justify-center rounded-control text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink"
                >
                  <KeyboardIcon className="h-4 w-4" />
                </button>
                <ThemeToggle />
                <button
                  type="button"
                  onClick={() => setSecao("config")}
                  title="Configurações"
                  aria-label="Configurações"
                  aria-pressed={secao === "config"}
                  className={`flex h-11 w-11 items-center justify-center rounded-card transition-all ${
                    secao === "config"
                      ? "glow-primary bg-primary text-white"
                      : "text-ink-muted hover:bg-surface-2 hover:text-ink"
                  }`}
                >
                  <SettingsIcon className="h-[19px] w-[19px]" />
                </button>
              </div>
            </nav>

            <main className="relative min-w-0 flex-1">
              <div className="absolute inset-0" hidden={secao !== "prospeccao"}>
                <ProspeccaoShell />
              </div>
              {secao === "templates" && <div className="h-full overflow-y-auto"><TemplatesView /></div>}
              {secao === "blacklist" && <div className="h-full overflow-y-auto"><BlacklistView /></div>}
              {secao === "config" && <div className="h-full overflow-y-auto"><ConfigView /></div>}
            </main>
          </div>
        </ToastProvider>
      </MensagemProvider>
    </ProjetoProvider>
  );
}
