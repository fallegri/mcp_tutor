"use client";

import { useState } from "react";
import type { ConsultationState } from "@/types";
import { getCurrentStep } from "@/lib/consultation/flow";

interface ConsultationChatProps {
  state: ConsultationState;
  onAnswer: (answer: unknown) => void;
}

export function ConsultationChat({ state, onAnswer }: ConsultationChatProps) {
  const [textInput, setTextInput] = useState("");
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  const step = getCurrentStep(state);

  const handleSubmit = () => {
    if (step.type === "text") {
      if (textInput.trim()) {
        onAnswer(textInput.trim());
        setTextInput("");
      }
    } else if (step.type === "multiselect") {
      onAnswer(selectedOptions);
      setSelectedOptions([]);
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
      <div className="p-4 rounded-lg border border-border bg-card">
        {step.type === "text" && (
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

        {step.type === "multiselect" && (
          <div className="space-y-3">
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
            <button
              onClick={handleSubmit}
              disabled={selectedOptions.length === 0}
              className="w-full px-4 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50"
            >
              Confirmar selección ({selectedOptions.length})
            </button>
          </div>
        )}

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
