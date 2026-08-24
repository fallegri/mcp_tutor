"use client";

import { useState } from "react";
import type { GenerationResult } from "@/types";
import {
  downloadProjectAsZip,
  downloadSingleFile,
} from "@/lib/utils/download";

interface ResultsViewProps {
  result: GenerationResult;
}

export function ResultsView({ result }: ResultsViewProps) {
  const [activeTab, setActiveTab] = useState<
    "files" | "platforms" | "security"
  >("files");
  const [selectedFile, setSelectedFile] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleDownloadZip = async () => {
    setIsDownloading(true);
    try {
      await downloadProjectAsZip(result);
    } catch (err) {
      console.error("Error generating ZIP:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadFile = () => {
    const file = result.files[selectedFile];
    if (file) downloadSingleFile(file);
  };

  const handleCopyFile = () => {
    navigator.clipboard.writeText(result.files[selectedFile]?.content || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Success header with download button */}
      <div className="p-6 rounded-lg bg-green-500/10 border border-green-500/30">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">✅</span>
            <div>
              <h2 className="text-xl font-bold text-green-400">
                ¡MCP Generado Exitosamente!
              </h2>
              <p className="text-muted-foreground">
                Proyecto: {result.project.name} | {result.files.length} archivos
                | Score: {result.securityReport.score}/100
              </p>
            </div>
          </div>

          {/* === DOWNLOAD ZIP BUTTON === */}
          <button
            onClick={handleDownloadZip}
            disabled={isDownloading}
            className="flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-primary/25"
          >
            {isDownloading ? (
              <>
                <span className="animate-spin">⚙️</span>
                Generando ZIP...
              </>
            ) : (
              <>
                <span>📦</span>
                Descargar TODO (.zip)
              </>
            )}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        <TabButton
          active={activeTab === "files"}
          onClick={() => setActiveTab("files")}
          label="📁 Archivos"
        />
        <TabButton
          active={activeTab === "platforms"}
          onClick={() => setActiveTab("platforms")}
          label="🔌 Plataformas"
        />
        <TabButton
          active={activeTab === "security"}
          onClick={() => setActiveTab("security")}
          label="🛡️ Seguridad"
        />
      </div>

      {/* Tab content: FILES */}
      {activeTab === "files" && (
        <div className="space-y-4">
          {/* Action bar */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border">
            <span className="text-sm text-muted-foreground">
              {result.files.length} archivos generados
            </span>
            <div className="flex gap-2">
              <button
                onClick={handleDownloadFile}
                className="text-xs px-3 py-1.5 rounded bg-secondary hover:bg-secondary/80 border border-border flex items-center gap-1"
              >
                📄 Descargar archivo actual
              </button>
              <button
                onClick={handleDownloadZip}
                disabled={isDownloading}
                className="text-xs px-3 py-1.5 rounded bg-primary/20 text-primary hover:bg-primary/30 flex items-center gap-1 font-medium"
              >
                📦 Descargar TODO (.zip)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* File list */}
            <div className="space-y-1">
              {result.files.map((file, i) => (
                <button
                  key={file.path}
                  onClick={() => setSelectedFile(i)}
                  className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                    selectedFile === i
                      ? "bg-primary/20 text-primary"
                      : "hover:bg-secondary"
                  }`}
                >
                  <div className="font-mono text-xs truncate">{file.path}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {file.description}
                  </div>
                </button>
              ))}
            </div>

            {/* File content */}
            <div className="md:col-span-3">
              <div className="rounded-lg border border-border overflow-hidden">
                <div className="px-4 py-2 bg-secondary text-sm font-mono flex items-center justify-between">
                  <span>{result.files[selectedFile]?.path}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCopyFile}
                      className="text-xs px-2 py-1 rounded bg-primary/20 text-primary hover:bg-primary/30"
                    >
                      {copied ? "✅ Copiado!" : "📋 Copiar"}
                    </button>
                    <button
                      onClick={handleDownloadFile}
                      className="text-xs px-2 py-1 rounded bg-primary/20 text-primary hover:bg-primary/30"
                    >
                      💾 Guardar
                    </button>
                  </div>
                </div>
                <pre className="p-4 overflow-x-auto text-sm bg-background max-h-[500px] overflow-y-auto">
                  <code>{result.files[selectedFile]?.content}</code>
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab content: PLATFORMS */}
      {activeTab === "platforms" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={handleDownloadZip}
              disabled={isDownloading}
              className="text-sm px-4 py-2 rounded bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2"
            >
              📦 Descargar TODO con configs (.zip)
            </button>
          </div>

          {result.platformConfigs.map((config) => (
            <div
              key={config.platform}
              className="p-4 rounded-lg border border-border"
            >
              <h3 className="font-bold mb-2">
                {config.platform.replace("_", " ").toUpperCase()}
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Comando de instalación:
                  </p>
                  <code className="block p-2 rounded bg-secondary text-sm font-mono">
                    {config.installCommand}
                  </code>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Archivo de configuración ({config.configFile}):
                  </p>
                  <pre className="p-3 rounded bg-secondary text-sm font-mono overflow-x-auto">
                    {config.configContent}
                  </pre>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab content: SECURITY */}
      {activeTab === "security" && (
        <div className="space-y-4">
          {/* Score */}
          <div
            className={`p-6 rounded-lg border ${
              result.securityReport.passed
                ? "border-green-500/30 bg-green-500/5"
                : "border-red-500/30 bg-red-500/5"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold">
                  Score: {result.securityReport.score}/100
                </h3>
                <p className="text-sm text-muted-foreground">
                  Nivel: {result.securityReport.level} |{" "}
                  {result.securityReport.passed
                    ? "✅ Aprobado"
                    : "❌ No aprobado"}
                </p>
              </div>
              <div
                className={`text-4xl ${result.securityReport.passed ? "text-green-400" : "text-red-400"}`}
              >
                {result.securityReport.passed ? "🛡️" : "⚠️"}
              </div>
            </div>
          </div>

          {/* Issues */}
          {result.securityReport.issues.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-bold">Issues encontrados:</h3>
              {result.securityReport.issues.map((issue) => (
                <div
                  key={issue.id}
                  className="p-3 rounded border border-border flex items-start gap-3"
                >
                  <span
                    className={`text-sm px-2 py-0.5 rounded ${
                      issue.severity === "critical"
                        ? "bg-red-500/20 text-red-400"
                        : issue.severity === "high"
                          ? "bg-orange-500/20 text-orange-400"
                          : issue.severity === "medium"
                            ? "bg-yellow-500/20 text-yellow-400"
                            : "bg-blue-500/20 text-blue-400"
                    }`}
                  >
                    {issue.severity}
                  </span>
                  <div>
                    <p className="font-medium text-sm">{issue.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {issue.recommendation}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Recommendations */}
          <div className="space-y-2">
            <h3 className="font-bold">Recomendaciones:</h3>
            {result.securityReport.recommendations.map((rec, i) => (
              <p key={i} className="text-sm text-muted-foreground">
                {rec}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TabButton({
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
      className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
        active
          ? "border-primary text-primary"
          : "border-transparent text-muted-foreground hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}
