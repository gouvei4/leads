import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Prospector — Leads",
  description: "Busca, salva e organiza empresas para prospecção",
};

// Tema claro por padrão; só fica escuro se o usuário escolher no toggle.
const THEME_INIT_SCRIPT = `(function(){try{var s=localStorage.getItem("prospector:theme");document.documentElement.setAttribute("data-theme",s==="dark"?"dark":"light");}catch(e){document.documentElement.setAttribute("data-theme","light");}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={jakarta.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
