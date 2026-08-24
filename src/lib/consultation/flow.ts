import type {
  ConsultationStep,
  ConsultationState,
  Mode,
  McpProjectConfig,
  Platform,
  SecurityLevel,
  Transport,
} from "@/types";
import { searchKnowledge, getSuggestedSkills } from "@/lib/knowledge/search";

/**
 * Consultation Flow Engine
 * 
 * Manages the interactive consultation process where the system
 * asks the user questions to understand their MCP requirements.
 * 
 * Flow:
 * 1. What mode? (Tutor or Orchestrator)
 * 2. What's the objective of the MCP?
 * 3. Search knowledge base for similar MCPs
 * 4. Which platforms to target?
 * 5. What skills/tools to include?
 * 6. Any additional material to include?
 * 7. Security level selection
 * 8. Transport selection
 * 9. Confirmation
 */

const CONSULTATION_STEPS: ConsultationStep[] = [
  {
    id: "mode",
    question: "¿En qué modo deseas trabajar?",
    type: "select",
    options: [
      "🎯 Orquestador - Genera el MCP completo automáticamente",
      "📚 Tutor - Aprende paso a paso cómo crear MCPs",
    ],
    helpText:
      "El Orquestador crea el código directamente. El Tutor te enseña el proceso con diagramas y explicaciones.",
  },
  {
    id: "objective",
    question: "¿Cuál es el objetivo principal de tu MCP?",
    type: "text",
    helpText:
      "Describe qué quieres que haga tu servidor MCP. Ejemplo: 'Conectar con mi base de datos PostgreSQL para consultas de solo lectura'",
    validation: "min:10",
  },
  {
    id: "name",
    question: "¿Cómo quieres llamar a tu servidor MCP?",
    type: "text",
    helpText:
      "Un nombre descriptivo corto. Ejemplo: 'Database Explorer', 'Code Analyzer'",
    validation: "min:2,max:50",
  },
  {
    id: "platforms",
    question: "¿En qué plataformas AI quieres usar tu MCP?",
    type: "multiselect",
    options: [
      "Claude Code (Anthropic)",
      "OpenAI Codex",
      "OpenCode",
      "Antigravity",
      "Cursor",
      "Kiro",
      "Universal (todas)",
    ],
    helpText: "Selecciona una o más plataformas. Se generará configuración para cada una.",
  },
  {
    id: "knowledge_search",
    question:
      "Busquemos MCPs similares en nuestra base de conocimiento. ¿Qué tipo de funcionalidad te interesa?",
    type: "text",
    helpText:
      "Describe el tipo de herramientas que necesitas. Buscaremos patrones similares.",
  },
  {
    id: "skills",
    question: "¿Qué herramientas (tools) quieres incluir en tu MCP?",
    type: "multiselect",
    options: [], // Dynamic, populated based on search
    helpText:
      "Selecciona las herramientas que quieres que tu MCP exponga. Puedes agregar personalizadas después.",
  },
  {
    id: "additional_material",
    question:
      "¿Deseas agregar material teórico o skills de otros sistemas como base?",
    type: "confirm",
    helpText:
      "Puedes proporcionar documentación, especificaciones, o código de referencia.",
  },
  {
    id: "material_upload",
    question:
      "Pega o describe el material adicional que quieres incluir como base:",
    type: "text",
    helpText:
      "Puede ser documentación de API, ejemplos de código, especificaciones, etc.",
  },
  {
    id: "security",
    question: "¿Qué nivel de seguridad necesitas?",
    type: "select",
    options: [
      "🔒 Estricto - Máxima seguridad, ideal para producción",
      "🛡️ Estándar - Balance entre seguridad y funcionalidad",
      "⚡ Permisivo - Máxima flexibilidad, solo para desarrollo local",
    ],
    helpText:
      "Recomendamos 'Estándar' para la mayoría de casos. 'Estricto' para datos sensibles.",
  },
  {
    id: "transport",
    question: "¿Cómo se comunicará tu MCP con los clientes?",
    type: "select",
    options: [
      "📡 stdio - Local, ejecución directa (más común)",
      "🌐 HTTP - Remoto, desplegable en la nube",
      "📺 SSE - Server-Sent Events, para streaming",
    ],
    helpText:
      "stdio es lo más común para uso local. HTTP para desplegar en Vercel u otra nube.",
  },
  {
    id: "confirm",
    question: "¿Todo listo? Confirma para generar tu MCP:",
    type: "confirm",
    helpText: "Revisa el resumen y confirma para iniciar la generación.",
  },
];

/**
 * Get the initial consultation state
 */
export function createConsultationState(): ConsultationState {
  return {
    currentStep: 0,
    totalSteps: CONSULTATION_STEPS.length,
    answers: {},
    mode: "orchestrator",
    suggestedSkills: [],
    knowledgeResults: [],
  };
}

/**
 * Get the current consultation step
 */
export function getCurrentStep(state: ConsultationState): ConsultationStep {
  return CONSULTATION_STEPS[state.currentStep];
}

/**
 * Process an answer and advance the consultation
 */
export function processAnswer(
  state: ConsultationState,
  answer: unknown
): ConsultationState {
  const currentStep = CONSULTATION_STEPS[state.currentStep];
  const newState = { ...state };

  // Store answer
  newState.answers = { ...state.answers, [currentStep.id]: answer };

  // Process specific steps
  switch (currentStep.id) {
    case "mode":
      newState.mode = (answer as string).includes("Orquestador")
        ? "orchestrator"
        : "tutor";
      break;

    case "objective":
      // Search knowledge base based on objective
      const objective = answer as string;
      newState.knowledgeResults = searchKnowledge(objective);
      newState.suggestedSkills = getSuggestedSkills(objective);
      break;

    case "knowledge_search":
      // Update knowledge results
      const query = answer as string;
      if (query.length > 2) {
        newState.knowledgeResults = searchKnowledge(query);
        newState.suggestedSkills = getSuggestedSkills(query);
      }
      break;

    case "additional_material":
      // If user says no to additional material, skip the upload step
      if (answer === false || answer === "no") {
        newState.currentStep = state.currentStep + 2; // Skip material_upload
        return newState;
      }
      break;
  }

  // Advance to next step
  newState.currentStep = state.currentStep + 1;

  return newState;
}

/**
 * Build the final MCP configuration from consultation answers
 */
export function buildConfigFromAnswers(
  state: ConsultationState
): McpProjectConfig {
  const { answers } = state;

  // Parse platforms
  const platformMap: Record<string, Platform> = {
    "Claude Code (Anthropic)": "claude_code",
    "OpenAI Codex": "openai_codex",
    OpenCode: "opencode",
    Antigravity: "antigravity",
    Cursor: "cursor",
    Kiro: "kiro",
    "Universal (todas)": "universal",
  };

  const selectedPlatforms = ((answers.platforms as string[]) || ["Universal (todas)"]).map(
    (p) => platformMap[p] || "universal"
  );

  // Parse security level
  const securityMap: Record<string, SecurityLevel> = {
    "🔒 Estricto - Máxima seguridad, ideal para producción": "strict",
    "🛡️ Estándar - Balance entre seguridad y funcionalidad": "standard",
    "⚡ Permisivo - Máxima flexibilidad, solo para desarrollo local":
      "permissive",
  };

  const securityLevel: SecurityLevel =
    securityMap[answers.security as string] || "standard";

  // Parse transport
  const transportMap: Record<string, Transport> = {
    "📡 stdio - Local, ejecución directa (más común)": "stdio",
    "🌐 HTTP - Remoto, desplegable en la nube": "http",
    "📺 SSE - Server-Sent Events, para streaming": "sse",
  };

  const transport: Transport =
    transportMap[answers.transport as string] || "stdio";

  // Parse skills
  const skills = ((answers.skills as string[]) || ["Default Tool"]).map(
    (name, i) => ({
      id: `skill-${i}`,
      name,
    })
  );

  return {
    name: (answers.name as string) || "My MCP Server",
    description: (answers.objective as string) || "",
    objective: (answers.objective as string) || "",
    mode: state.mode,
    targetPlatforms: selectedPlatforms,
    transport,
    securityLevel,
    skills,
    additionalMaterial: answers.material_upload
      ? [
          {
            name: "User Material",
            type: "documentation",
            content: answers.material_upload as string,
          },
        ]
      : undefined,
  };
}

/**
 * Get a summary of the current consultation state
 */
export function getStateSummary(state: ConsultationState): string {
  const { answers } = state;
  const parts: string[] = [];

  if (answers.mode)
    parts.push(`**Modo**: ${(answers.mode as string).includes("Orquestador") ? "Orquestador" : "Tutor"}`);
  if (answers.name) parts.push(`**Nombre**: ${answers.name}`);
  if (answers.objective) parts.push(`**Objetivo**: ${answers.objective}`);
  if (answers.platforms)
    parts.push(`**Plataformas**: ${(answers.platforms as string[]).join(", ")}`);
  if (answers.security) parts.push(`**Seguridad**: ${answers.security}`);
  if (answers.transport) parts.push(`**Transporte**: ${answers.transport}`);

  return parts.join("\n");
}
