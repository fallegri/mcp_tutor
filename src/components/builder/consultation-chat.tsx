"use client";

import { useState } from "react";
import type { ConsultationState } from "@/types";
import { getCurrentStep } from "@/lib/consultation/flow";
import { FileUpload, type UploadedFile } from "./file-upload";

interface ConsultationChatProps {
  state: ConsultationState;
  onAnswer: (answer: unknown) => void;
}

export function ConsultationChat({ state, onAnswer }: ConsultationChatProps) {
  const [textInput, setTextInput] = useState("");
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [inputMode, setInputMode] = useState<"text" | "file">("text");

  const step = getCurrentStep(state);

  // Steps that support file upload
  const supportsFileUpload = [
    "material_upload",
    "skills",
    "objective",
    "knowledge_search",
  ].includes(step.id);

  const handleSubmit = () => {
    if (step.type === "text" || step.type === "upload") {
      if (inputMode === "file" && uploadedFiles.length > 0) {
        // Send files as structured content
        const filesContent = uploadedFiles.map((f) => ({
          name: f.name,
          type: getFileCategory(f.name),
          content: f.content,
        }));
        onAnswer(filesContent);
        setUploadedFiles([]);
        setInputMode("text");
      } else if (textInput.trim()) {
        onAnswer(textInput.trim());
        setTextInput("");
      }
    } else if (step.type === "multiselect") {
      // Include both selected options AND uploaded files as custom skills
      const customSkillsFromFiles = uploadedFiles.map((f) =>
        f.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ")
      );
      const allSelected = [...selectedOptions, ...customSkillsFromFiles];
      onAnswer(allSelected);
      setSelectedOptions([]);
      setUploadedFiles([]);
    }
  };

  const handleSelectOption = (option: string) => {
    onAnswer(option);
  };

  const handleConfirm = (value: boolean) => {
    onAnswer(value);
  };

  const toggleOption = (option: string) => {
    setSelectedOptions((prev) =>
      prev.includes(option)
        ? prev.filter((o) => o !== option)
        : [...prev, option]
    );
  };

  const handleFilesUploaded = (files: UploadedFile[]) => {
    setUploadedFiles(files);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Question */}
      <div className="p-6 rounded-lg bg-card border border-border">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🤖</span>
          <div className="space-y-3 flex-1">
            <p className="text-lg font-medium">{step.question}</p>
            {step.helpText && (
              <p className="text-sm text-muted-foreground">{step.helpText}</p>
            )}

            {/* Knowledge base results */}
            {state.knowledgeResults.length > 0 &&
              step.id === "knowledge_search" && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-medium text-primary">
                    📚 MCPs similares encontrados:
                  </p>
                  {state.knowledgeResults.map((r) => (
                    <div
                      key={r.id}
                      className="p-3 rounded bg-secondary/50 text-sm"
                    >
                      <span className="font-medium">{r.title}</span>
                      <span className="text-muted-foreground ml-2">
                        - {r.description}
                      </span>
                      <span className="ml-2 text-xs text-primary">
                        ({Math.round(r.relevanceScore * 100)}% relevante)
                      </span>
                    </div>
                  ))}
                </div>
              )}

            {/* Suggested skills */}
            {state.suggestedSkills.length > 0 && step.id === "skills" && (
              <div className="mt-2">
                <p className="text-sm text-primary mb-1">
                  💡 Skills sugeridos basados en tu objetivo:
                </p>
                <div className="flex flex-wrap gap-2">
                  {state.suggestedSkills.map((skill) => (
                    <span
                      key={skill}
                      className="px-2 py-1 text-xs rounded bg-primary/20 text-primary"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Input area */}
      <div className="p-4 rounded-lg border border-border bg-card space-y-4">
        {/* Text / Upload toggle for supported steps */}
        {(step.type === "text" || step.type === "upload") && supportsFileUpload && (
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <span className="text-xs text-muted-foreground">Modo de entrada:</span>
            <button
              onClick={() => setInputMode("text")}
              className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                inputMode === "text"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              ✏️ Escribir texto
            </button>
            <button
              onClick={() => setInputMode("file")}
              className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                inputMode === "file"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              📄 Subir archivo(s)
            </button>
          </div>
        )}

        {/* TEXT INPUT */}
        {(step.type === "text" || step.type === "upload") && inputMode === "text" && (
          <div className="space-y-3">
            {step.id === "material_upload" ? (
              /* Textarea for material (multiline) */
              <div className="space-y-3">
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Pega aquí tu documentación, especificación, o código de referencia..."
                  rows={8}
                  className="w-full px-4 py-3 rounded-lg bg-background border border-input focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-y text-sm font-mono"
                />
                <button
                  onClick={handleSubmit}
                  disabled={!textInput.trim()}
                  className="w-full px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Enviar material
                </button>
              </div>
            ) : (
              /* Regular single-line input */
              <div className="flex gap-3">
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  placeholder="Escribe tu respuesta..."
                  className="flex-1 px-4 py-3 rounded-lg bg-background border border-input focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button
                  onClick={handleSubmit}
                  disabled={!textInput.trim()}
                  className="px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Enviar
                </button>
              </div>
            )}
          </div>
        )}

        {/* FILE UPLOAD */}
        {(step.type === "text" || step.type === "upload") && inputMode === "file" && (
          <div className="space-y-4">
            <FileUpload
              onFilesUploaded={handleFilesUploaded}
              acceptedExtensions={getAcceptedExtensions(step.id)}
              maxFiles={step.id === "material_upload" ? 10 : 5}
              label={getUploadLabel(step.id)}
              helpText={getUploadHelpText(step.id)}
            />

            {uploadedFiles.length > 0 && (
              <button
                onClick={handleSubmit}
                className="w-full px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90"
              >
                📤 Enviar {uploadedFiles.length} archivo{uploadedFiles.length > 1 ? "s" : ""}
              </button>
            )}
          </div>
        )}

        {/* SELECT (single) */}
        {step.type === "select" && (
          <div className="space-y-2">
            {step.options?.map((option) => (
              <button
                key={option}
                onClick={() => handleSelectOption(option)}
                className="w-full text-left p-4 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-colors"
              >
                {option}
              </button>
            ))}
          </div>
        )}

        {/* MULTISELECT (with file upload support for skills) */}
        {step.type === "multiselect" && (
          <div className="space-y-4">
            {/* Options */}
            <div className="space-y-2">
              {(step.options && step.options.length > 0
                ? step.options
                : [
                    "File Operations",
                    "Database Query",
                    "Web Search",
                    "API Integration",
                    "Code Analysis",
                    "Custom Tool",
                  ]
              ).map((option) => (
                <label
                  key={option}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedOptions.includes(option)
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedOptions.includes(option)}
                    onChange={() => toggleOption(option)}
                    className="w-4 h-4 rounded border-input accent-primary"
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>

            {/* File upload for custom skills */}
            {step.id === "skills" && (
              <div className="border-t border-border pt-4">
                <p className="text-sm font-medium mb-3 text-muted-foreground">
                  📄 ¿Tienes skills en archivos? Súbelos aquí:
                </p>
                <FileUpload
                  onFilesUploaded={handleFilesUploaded}
                  acceptedExtensions={[".md", ".txt", ".json", ".ts", ".js", ".yaml", ".yml"]}
                  maxFiles={5}
                  label="Arrastra tus archivos de skills (.md, .ts, .json...)"
                  helpText="Cada archivo se agregará como una skill personalizada"
                />
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={selectedOptions.length === 0 && uploadedFiles.length === 0}
              className="w-full px-4 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50"
            >
              Confirmar selección ({selectedOptions.length + uploadedFiles.length})
            </button>
          </div>
        )}

        {/* CONFIRM */}
        {step.type === "confirm" && (
          <div className="flex gap-4">
            <button
              onClick={() => handleConfirm(true)}
              className="flex-1 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90"
            >
              ✅ Sí, continuar
            </button>
            <button
              onClick={() => handleConfirm(false)}
              className="flex-1 px-6 py-3 rounded-lg border border-border hover:border-primary text-foreground"
            >
              ❌ No
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ============ HELPERS ============

function getAcceptedExtensions(stepId: string): string[] {
  switch (stepId) {
    case "material_upload":
      return [".md", ".txt", ".json", ".ts", ".js", ".yaml", ".yml", ".py", ".html", ".css"];
    case "skills":
      return [".md", ".txt", ".json", ".ts", ".js", ".yaml", ".yml"];
    default:
      return [".md", ".txt", ".json"];
  }
}

function getUploadLabel(stepId: string): string {
  switch (stepId) {
    case "material_upload":
      return "Arrastra archivos de documentación, specs o código de referencia";
    case "skills":
      return "Arrastra archivos de skills (.md, .ts, .json)";
    default:
      return "Arrastra archivos aquí";
  }
}

function getUploadHelpText(stepId: string): string {
  switch (stepId) {
    case "material_upload":
      return "Acepta: Markdown, texto, JSON, TypeScript, JavaScript, YAML, Python, HTML, CSS";
    case "skills":
      return "Cada archivo se interpretará como una skill personalizada para tu MCP";
    default:
      return "";
  }
}

function getFileCategory(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "md":
    case "txt":
      return "documentation";
    case "ts":
    case "js":
    case "py":
      return "code";
    case "json":
    case "yaml":
    case "yml":
      return "specification";
    default:
      return "example";
  }
}
