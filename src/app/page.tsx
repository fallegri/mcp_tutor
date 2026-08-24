"use client";

import { useState } from "react";
import { Header } from "@/components/layout/header";
import { ModeSelector } from "@/components/mode-selector";
import { BuilderView } from "@/components/builder/builder-view";
import { TutorView } from "@/components/tutor/tutor-view";
import type { Mode } from "@/types";

export default function HomePage() {
  const [selectedMode, setSelectedMode] = useState<Mode | null>(null);

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-8">
        {!selectedMode ? (
          <div className="space-y-8">
            {/* Hero Section */}
            <section className="text-center space-y-4 py-12">
              <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                MCP Builder
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Crea servidores MCP para Claude Code, OpenAI Codex, OpenCode,
                Antigravity y más. Seguridad integrada, múltiples plataformas,
                documentación automática.
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <span className="px-2 py-1 rounded bg-secondary">🔌 MCP 2025-06-18</span>
                <span className="px-2 py-1 rounded bg-secondary">🛡️ Seguridad OWASP</span>
                <span className="px-2 py-1 rounded bg-secondary">📊 Mermaid Diagrams</span>
              </div>
            </section>

            {/* Mode Selection */}
            <ModeSelector onSelectMode={setSelectedMode} />

            {/* Features */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6 py-8">
              <FeatureCard
                icon="🎯"
                title="Multi-Plataforma"
                description="Genera configuraciones para Claude Code, Codex, OpenCode, Cursor, Kiro y más"
              />
              <FeatureCard
                icon="🛡️"
                title="Seguridad Primero"
                description="Escaneo de vulnerabilidades, validación de inputs, rate limiting y sanitización"
              />
              <FeatureCard
                icon="📚"
                title="Base de Conocimiento"
                description="Busca MCPs similares, patrones probados y mejores prácticas"
              />
            </section>
          </div>
        ) : selectedMode === "orchestrator" ? (
          <BuilderView onBack={() => setSelectedMode(null)} />
        ) : (
          <TutorView onBack={() => setSelectedMode(null)} />
        )}
      </main>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="p-6 rounded-lg border border-border bg-card hover:border-primary/50 transition-colors">
      <div className="text-3xl mb-3">{icon}</div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  );
}
