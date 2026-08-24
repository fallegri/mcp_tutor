"use client";

import { useState, useCallback } from "react";
import type { McpProjectConfig, GenerationResult, ConsultationState } from "@/types";
import {
  createConsultationState,
  getCurrentStep,
  processAnswer,
  buildConfigFromAnswers,
  getStateSummary,
} from "@/lib/consultation/flow";
import { McpGenerator } from "@/lib/mcp/generator";
import { ConsultationChat } from "./consultation-chat";
import { ResultsView } from "./results-view";

interface BuilderViewProps {
  onBack: () => void;
}

export function BuilderView({ onBack }: BuilderViewProps) {
  const [state, setState] = useState<ConsultationState>(
    createConsultationState()
  );
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnswer = useCallback(
    (answer: unknown) => {
      const newState = processAnswer(state, answer);
      setState(newState);

      // If consultation is complete, generate MCP
      if (newState.currentStep >= 10) {
        generateMcp(newState);
      }
    },
    [state]
  );

  const generateMcp = async (finalState: ConsultationState) => {
    setIsGenerating(true);
    setError(null);

    try {
      const config = buildConfigFromAnswers(finalState);
      const generator = new McpGenerator();
      const generationResult = await generator.generate(config);
      setResult(generationResult);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error desconocido durante la generación"
      );
    } finally {
      setIsGenerating(false);
    }
  };

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
          <h1 className="text-3xl font-bold">🎯 Modo Orquestador</h1>
          <p className="text-muted-foreground">
            Responde las preguntas y generaré tu servidor MCP completo
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          Paso {Math.min(state.currentStep + 1, 10)} de 10
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-secondary rounded-full h-2">
        <div
          className="bg-primary h-2 rounded-full transition-all duration-300"
          style={{ width: `${(state.currentStep / 10) * 100}%` }}
        />
      </div>

      {/* Main content */}
      {result ? (
        <ResultsView result={result} />
      ) : isGenerating ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="animate-spin text-4xl">⚙️</div>
          <p className="text-lg font-medium">Generando tu servidor MCP...</p>
          <p className="text-sm text-muted-foreground">
            Aplicando validaciones de seguridad y generando configuraciones
          </p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-lg border border-destructive bg-destructive/10">
          <h3 className="font-bold text-destructive mb-2">Error</h3>
          <p>{error}</p>
          <button
            onClick={() => setError(null)}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded"
          >
            Reintentar
          </button>
        </div>
      ) : (
        <ConsultationChat
          state={state}
          onAnswer={handleAnswer}
        />
      )}
    </div>
  );
}
