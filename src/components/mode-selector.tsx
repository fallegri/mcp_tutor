"use client";

import type { Mode } from "@/types";

interface ModeSelectorProps {
  onSelectMode: (mode: Mode) => void;
}

export function ModeSelector({ onSelectMode }: ModeSelectorProps) {
  return (
    <section className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
      {/* Orchestrator Mode */}
      <button
        onClick={() => onSelectMode("orchestrator")}
        className="group p-8 rounded-xl border-2 border-border hover:border-purple-500 bg-card transition-all hover:shadow-lg hover:shadow-purple-500/10 text-left"
      >
        <div className="text-4xl mb-4">🎯</div>
        <h2 className="text-2xl font-bold mb-3 group-hover:text-purple-400 transition-colors">
          Modo Orquestador
        </h2>
        <p className="text-muted-foreground mb-4">
          Genera tu servidor MCP completo de forma automática. El sistema te
          guía con preguntas, busca en la base de conocimiento y produce código
          funcional con seguridad integrada.
        </p>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-center gap-2">
            <span className="text-green-400">✓</span> Generación automática de código
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-400">✓</span> Configuración multi-plataforma
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-400">✓</span> Escaneo de seguridad incluido
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-400">✓</span> Proyecto listo para desplegar
          </li>
        </ul>
        <div className="mt-6 text-purple-400 font-medium group-hover:translate-x-2 transition-transform">
          Comenzar →
        </div>
      </button>

      {/* Tutor Mode */}
      <button
        onClick={() => onSelectMode("tutor")}
        className="group p-8 rounded-xl border-2 border-border hover:border-blue-500 bg-card transition-all hover:shadow-lg hover:shadow-blue-500/10 text-left"
      >
        <div className="text-4xl mb-4">📚</div>
        <h2 className="text-2xl font-bold mb-3 group-hover:text-blue-400 transition-colors">
          Modo Tutor
        </h2>
        <p className="text-muted-foreground mb-4">
          Aprende paso a paso cómo crear MCPs. Incluye diagramas Mermaid
          compatibles con Google Docs/Word, explicaciones para no técnicos y
          documentación completa en Markdown.
        </p>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-center gap-2">
            <span className="text-green-400">✓</span> Diagramas Mermaid visuales
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-400">✓</span> Explicaciones no técnicas
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-400">✓</span> Documentación paso a paso
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-400">✓</span> Compatible Google Docs/Word
          </li>
        </ul>
        <div className="mt-6 text-blue-400 font-medium group-hover:translate-x-2 transition-transform">
          Aprender →
        </div>
      </button>
    </section>
  );
}
