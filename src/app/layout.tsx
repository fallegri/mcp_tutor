import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MCP Builder - Crea Servidores MCP para AI",
  description:
    "Genera servidores MCP compatibles con Claude Code, OpenAI Codex, OpenCode, Antigravity y más. Modo Tutor y Orquestador.",
  keywords: [
    "MCP",
    "Model Context Protocol",
    "Claude Code",
    "OpenAI Codex",
    "AI Tools",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <body className={inter.className}>
        <div className="min-h-screen bg-background text-foreground">
          {children}
        </div>
      </body>
    </html>
  );
}
