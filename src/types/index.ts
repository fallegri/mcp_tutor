// ============ CORE TYPES ============

export type Platform =
  | "claude_code"
  | "openai_codex"
  | "opencode"
  | "antigravity"
  | "cursor"
  | "kiro"
  | "universal";

export type Transport = "stdio" | "http" | "sse";

export type Mode = "orchestrator" | "tutor";

export type SecurityLevel = "strict" | "standard" | "permissive";

export type McpStatus = "draft" | "generating" | "completed" | "error";

// ============ MCP GENERATION ============

export type AccessStrategy =
  | "code_input"
  | "filesystem"
  | "url_fetch"
  | "database"
  | "api_call"
  | "browser"
  | "hybrid";

export interface McpProjectConfig {
  name: string;
  description: string;
  objective: string;
  mode: Mode;
  targetPlatforms: Platform[];
  transport: Transport;
  securityLevel: SecurityLevel;
  skills: SkillConfig[];
  accessStrategy?: AccessStrategy;
  contextAnalysis?: ContextAnalysisResult;
  additionalMaterial?: MaterialInput[];
}

export interface ContextAnalysisResult {
  primaryStrategy: AccessStrategy;
  secondaryStrategies: AccessStrategy[];
  needsResources: boolean;
  suggestedResources: Array<{
    name: string;
    description: string;
    type: string;
    contentTemplate: string;
  }>;
  warnings: Array<{
    severity: string;
    title: string;
    description: string;
    recommendation: string;
  }>;
  requiredDependencies: string[];
  complexity: number;
}

export interface SkillConfig {
  id: string;
  name: string;
  customParams?: Record<string, unknown>;
}

export interface MaterialInput {
  name: string;
  type: "documentation" | "code" | "specification" | "example";
  content: string;
}

// ============ GENERATION OUTPUT ============

export interface GenerationResult {
  success: boolean;
  project: {
    id: string;
    name: string;
  };
  files: GeneratedFile[];
  platformConfigs: PlatformConfig[];
  securityReport: SecurityReport;
  tutorDocs?: TutorDocumentation;
}

export interface GeneratedFile {
  path: string;
  content: string;
  language: string;
  description: string;
}

export interface PlatformConfig {
  platform: Platform;
  configFile: string;
  configContent: string;
  installCommand: string;
  setupInstructions: string;
}

// ============ SECURITY ============

export interface SecurityReport {
  score: number;
  level: SecurityLevel;
  issues: SecurityIssue[];
  recommendations: string[];
  passed: boolean;
}

export interface SecurityIssue {
  id: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  title: string;
  description: string;
  location?: string;
  recommendation: string;
}

// ============ TUTOR MODE ============

export interface TutorDocumentation {
  title: string;
  overview: string;
  mermaidDiagrams: MermaidDiagram[];
  steps: TutorStep[];
  glossary: GlossaryEntry[];
  exportFormats: ExportFormat[];
}

export interface MermaidDiagram {
  id: string;
  title: string;
  description: string;
  code: string;
  type: "flowchart" | "sequence" | "class" | "state" | "er";
}

export interface TutorStep {
  number: number;
  title: string;
  explanation: string;
  codeExample?: string;
  diagram?: string;
  nonTechnicalExplanation: string;
  tips: string[];
}

export interface GlossaryEntry {
  term: string;
  definition: string;
  example?: string;
}

export interface ExportFormat {
  name: string;
  format: "md" | "html" | "pdf";
  content: string;
}

// ============ CONSULTATION FLOW ============

export interface ConsultationStep {
  id: string;
  question: string;
  type: "text" | "select" | "multiselect" | "confirm" | "upload";
  options?: string[];
  validation?: string;
  helpText?: string;
}

export interface ConsultationState {
  currentStep: number;
  totalSteps: number;
  answers: Record<string, unknown>;
  mode: Mode;
  suggestedSkills: string[];
  knowledgeResults: KnowledgeSearchResult[];
}

export interface KnowledgeSearchResult {
  id: string;
  title: string;
  description: string;
  relevanceScore: number;
  category: string;
  tags: string[];
}

// ============ UI STATE ============

export interface AppState {
  mode: Mode | null;
  currentProject: McpProjectConfig | null;
  consultationState: ConsultationState | null;
  generationResult: GenerationResult | null;
  isGenerating: boolean;
  error: string | null;
}
