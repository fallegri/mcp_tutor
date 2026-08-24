"use client";

import { useState, useMemo } from "react";
import type { McpProjectConfig, TutorDocumentation } from "@/types";
import { TutorDocGenerator } from "@/lib/tutor/docs";

interface TutorViewProps {
  onBack: () => void;
}

// Default config for tutorial demo
const defaultConfig: McpProjectConfig = {
  name: "Mi Primer MCP",
  description: "Un servidor MCP de ejemplo para aprender",
  objective: "Aprender cómo se construye un servidor MCP paso a paso",
  mode: "tutor",
  targetPlatforms: ["claude_code", "openai_codex", "universal"],
  transport: "stdio",
  securityLevel: "standard",
  skills: [
    { id: "skill-1", name: "Consultar Datos" },
    { id: "skill-2", name: "Procesar Texto" },
  ],
};

export function TutorView({ onBack }: TutorViewProps) {
  const [config, setConfig] = useState<McpProjectConfig>(defaultConfig);
  const [activeSection, setActiveSection] = useState<
    "overview" | "diagrams" | "steps" | "glossary" | "export"
  >("overview");

  const documentation = useMemo(() => {
    const generator = new TutorDocGenerator();
    return generator.generate(config);
  }, [config]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={onBack}
            className="text-sm text-muted-foreground hover:text-foreground mb-2 flex items-center gap-1"
          >
            ← Volver
          </button>
          <h1 className="text-3xl font-bold">📚 Modo Tutor</h1>
          <p className="text-muted-foreground">
            Aprende paso a paso cómo funcionan los servidores MCP
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-4">
        <NavButton
          active={activeSection === "overview"}
          onClick={() => setActiveSection("overview")}
          label="📋 Visión General"
        />
        <NavButton
          active={activeSection === "diagrams"}
          onClick={() => setActiveSection("diagrams")}
          label="📊 Diagramas"
        />
        <NavButton
          active={activeSection === "steps"}
          onClick={() => setActiveSection("steps")}
          label="📝 Paso a Paso"
        />
        <NavButton
          active={activeSection === "glossary"}
          onClick={() => setActiveSection("glossary")}
          label="📚 Glosario"
        />
        <NavButton
          active={activeSection === "export"}
          onClick={() => setActiveSection("export")}
          label="💾 Exportar"
        />
      </div>

      {/* Content */}
      {activeSection === "overview" && (
        <OverviewSection documentation={documentation} />
      )}
      {activeSection === "diagrams" && (
        <DiagramsSection documentation={documentation} />
      )}
      {activeSection === "steps" && (
        <StepsSection documentation={documentation} />
      )}
      {activeSection === "glossary" && (
        <GlossarySection documentation={documentation} />
      )}
      {activeSection === "export" && (
        <ExportSection documentation={documentation} />
      )}
    </div>
  );
}

// ============ SECTIONS ============

function OverviewSection({
  documentation,
}: {
  documentation: TutorDocumentation;
}) {
  return (
    <div className="prose prose-invert max-w-none">
      <div className="p-6 rounded-lg border border-border bg-card">
        <div
          className="whitespace-pre-wrap text-sm leading-relaxed"
          dangerouslySetInnerHTML={{
            __html: documentation.overview
              .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
              .replace(/### (.*)/g, "<h3>$1</h3>")
              .replace(/## (.*)/g, "<h2>$1</h2>")
              .replace(/- (.*)/g, "<li>$1</li>"),
          }}
        />
      </div>
    </div>
  );
}

function DiagramsSection({
  documentation,
}: {
  documentation: TutorDocumentation;
}) {
  const [activeDiagram, setActiveDiagram] = useState(0);

  return (
    <div className="space-y-4">
      {/* Diagram selector */}
      <div className="flex flex-wrap gap-2">
        {documentation.mermaidDiagrams.map((diagram, i) => (
          <button
            key={diagram.id}
            onClick={() => setActiveDiagram(i)}
            className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
              activeDiagram === i
                ? "bg-primary text-primary-foreground"
                : "bg-secondary hover:bg-secondary/80"
            }`}
          >
            {diagram.title}
          </button>
        ))}
      </div>

      {/* Active diagram */}
      {documentation.mermaidDiagrams[activeDiagram] && (
        <div className="p-6 rounded-lg border border-border bg-card space-y-4">
          <div>
            <h3 className="text-lg font-bold">
              {documentation.mermaidDiagrams[activeDiagram].title}
            </h3>
            <p className="text-sm text-muted-foreground">
              {documentation.mermaidDiagrams[activeDiagram].description}
            </p>
          </div>

          {/* Mermaid code block */}
          <div className="rounded-lg overflow-hidden border border-border">
            <div className="px-4 py-2 bg-secondary flex items-center justify-between">
              <span className="text-sm font-mono">Mermaid</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(
                    documentation.mermaidDiagrams[activeDiagram].code
                  );
                }}
                className="text-xs px-2 py-1 rounded bg-primary/20 text-primary hover:bg-primary/30"
              >
                📋 Copiar código
              </button>
            </div>
            <pre className="p-4 text-sm overflow-x-auto bg-background">
              <code>{documentation.mermaidDiagrams[activeDiagram].code}</code>
            </pre>
          </div>

          <div className="p-3 rounded bg-blue-500/10 border border-blue-500/30 text-sm">
            💡 <strong>Tip:</strong> Copia el código Mermaid y pégalo en{" "}
            <a
              href="https://mermaid.live"
              target="_blank"
              rel="noopener"
              className="text-primary underline"
            >
              mermaid.live
            </a>{" "}
            para ver el diagrama. Luego puedes exportar la imagen a Google Docs o Word.
          </div>
        </div>
      )}
    </div>
  );
}

function StepsSection({
  documentation,
}: {
  documentation: TutorDocumentation;
}) {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {/* Step navigation */}
      <div className="space-y-1">
        {documentation.steps.map((step, i) => (
          <button
            key={step.number}
            onClick={() => setActiveStep(i)}
            className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
              activeStep === i
                ? "bg-primary/20 text-primary border-l-2 border-primary"
                : "hover:bg-secondary"
            }`}
          >
            <span className="font-medium">
              Paso {step.number}: {step.title}
            </span>
          </button>
        ))}
      </div>

      {/* Step content */}
      <div className="md:col-span-3 space-y-4">
        {documentation.steps[activeStep] && (
          <>
            <h2 className="text-2xl font-bold">
              Paso {documentation.steps[activeStep].number}:{" "}
              {documentation.steps[activeStep].title}
            </h2>

            {/* Technical explanation */}
            <div className="p-4 rounded-lg border border-border">
              <h3 className="font-bold mb-2 text-sm text-muted-foreground uppercase">
                Explicación Técnica
              </h3>
              <p className="text-sm whitespace-pre-wrap">
                {documentation.steps[activeStep].explanation}
              </p>
            </div>

            {/* Non-technical explanation */}
            <div className="p-4 rounded-lg border border-blue-500/30 bg-blue-500/5">
              <h3 className="font-bold mb-2 text-sm text-blue-400">
                💡 Explicación Simple (No Técnica)
              </h3>
              <p className="text-sm">
                {documentation.steps[activeStep].nonTechnicalExplanation}
              </p>
            </div>

            {/* Code example */}
            {documentation.steps[activeStep].codeExample && (
              <div className="rounded-lg overflow-hidden border border-border">
                <div className="px-4 py-2 bg-secondary text-sm font-mono">
                  Ejemplo de Código
                </div>
                <pre className="p-4 text-sm overflow-x-auto bg-background">
                  <code>{documentation.steps[activeStep].codeExample}</code>
                </pre>
              </div>
            )}

            {/* Tips */}
            <div className="p-4 rounded-lg bg-secondary/50">
              <h3 className="font-bold mb-2 text-sm">📌 Consejos</h3>
              <ul className="space-y-1">
                {documentation.steps[activeStep].tips.map((tip, i) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <span className="text-primary">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function GlossarySection({
  documentation,
}: {
  documentation: TutorDocumentation;
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">📚 Glosario de Términos</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {documentation.glossary.map((entry) => (
          <div
            key={entry.term}
            className="p-4 rounded-lg border border-border"
          >
            <h3 className="font-bold text-primary mb-1">{entry.term}</h3>
            <p className="text-sm text-muted-foreground mb-2">
              {entry.definition}
            </p>
            {entry.example && (
              <code className="text-xs bg-secondary px-2 py-1 rounded">
                {entry.example}
              </code>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ExportSection({
  documentation,
}: {
  documentation: TutorDocumentation;
}) {
  const [copied, setCopied] = useState(false);

  const markdownContent =
    documentation.exportFormats.find((f) => f.format === "md")?.content || "";

  const handleCopy = () => {
    navigator.clipboard.writeText(markdownContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([markdownContent], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "MCP-Tutorial.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">💾 Exportar Documentación</h2>
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="px-4 py-2 rounded bg-secondary hover:bg-secondary/80 text-sm"
          >
            {copied ? "✅ Copiado!" : "📋 Copiar Markdown"}
          </button>
          <button
            onClick={handleDownload}
            className="px-4 py-2 rounded bg-primary text-primary-foreground text-sm hover:bg-primary/90"
          >
            📥 Descargar .md
          </button>
        </div>
      </div>

      <div className="p-3 rounded bg-yellow-500/10 border border-yellow-500/30 text-sm">
        💡 <strong>Para Google Docs/Word:</strong> Descarga el archivo .md y usa un
        convertidor como{" "}
        <a
          href="https://pandoc.org"
          target="_blank"
          rel="noopener"
          className="text-primary underline"
        >
          Pandoc
        </a>{" "}
        o importa directamente en Google Docs (Archivo → Abrir → seleccionar .md).
        Los diagramas Mermaid se pueden pegar como imágenes desde{" "}
        <a
          href="https://mermaid.live"
          target="_blank"
          rel="noopener"
          className="text-primary underline"
        >
          mermaid.live
        </a>
        .
      </div>

      <div className="rounded-lg overflow-hidden border border-border">
        <div className="px-4 py-2 bg-secondary text-sm font-mono">
          MCP-Tutorial.md
        </div>
        <pre className="p-4 text-xs overflow-x-auto bg-background max-h-[600px] overflow-y-auto whitespace-pre-wrap">
          {markdownContent}
        </pre>
      </div>
    </div>
  );
}

// ============ HELPERS ============

function NavButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm rounded-lg transition-colors ${
        active
          ? "bg-primary text-primary-foreground"
          : "bg-secondary text-muted-foreground hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}
