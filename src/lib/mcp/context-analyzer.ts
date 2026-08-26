/**
 * Context Analyzer Module
 * 
 * Analyzes the MCP project configuration to detect:
 * 1. What data access strategy the MCP needs (code input, filesystem, URL, DB)
 * 2. What domain knowledge (Resources) should be embedded
 * 3. Whether tools have sufficient context to actually work
 * 
 * This prevents the #1 failure mode: MCPs that can't access what they need.
 */

import type { McpProjectConfig, SkillConfig } from "@/types";

// ============================================================
// TYPES
// ============================================================

export type AccessStrategy =
  | "code_input"       // AI passes code directly to the tool (most common)
  | "filesystem"       // MCP reads files from disk
  | "url_fetch"        // MCP fetches content from URLs
  | "database"         // MCP queries a database
  | "api_call"         // MCP calls external APIs
  | "browser"          // MCP uses a headless browser (Puppeteer/Playwright)
  | "hybrid";          // Combination of strategies

export interface ContextAnalysis {
  /** Primary access strategy recommended */
  primaryStrategy: AccessStrategy;
  /** Additional strategies that may be needed */
  secondaryStrategies: AccessStrategy[];
  /** Whether the MCP needs domain knowledge as Resources */
  needsResources: boolean;
  /** Suggested Resources to include */
  suggestedResources: SuggestedResource[];
  /** Warnings about potential context gaps */
  warnings: ContextWarning[];
  /** Required dependencies based on strategy */
  requiredDependencies: string[];
  /** Complexity score 1-5 */
  complexity: number;
}

export interface SuggestedResource {
  name: string;
  description: string;
  type: "criteria" | "schema" | "reference" | "config";
  /** Template content for the resource */
  contentTemplate: string;
}

export interface ContextWarning {
  severity: "critical" | "warning" | "info";
  title: string;
  description: string;
  recommendation: string;
}

// ============================================================
// KEYWORD DETECTION MAPS
// ============================================================

/** Keywords that indicate different access needs */
const ACCESS_KEYWORDS: Record<AccessStrategy, string[]> = {
  code_input: [
    "evaluar", "evaluate", "analizar", "analyze", "review", "revisar",
    "lint", "check", "validar", "validate", "audit", "verificar",
    "parse", "transform", "format", "refactor", "quality",
    "ux", "accesibilidad", "accessibility", "html", "css", "code",
    "iso", "norma", "standard", "compliance", "cumplimiento",
  ],
  filesystem: [
    "archivo", "file", "leer", "read", "escribir", "write", "directory",
    "carpeta", "folder", "path", "ruta", "log", "config", "save",
    "guardar", "crear archivo", "create file", "template",
  ],
  url_fetch: [
    "url", "web", "página", "page", "sitio", "site", "fetch", "scrape",
    "descargar", "download", "http", "api", "endpoint", "rest",
    "online", "internet", "crawl",
  ],
  database: [
    "database", "base de datos", "sql", "query", "consulta", "tabla",
    "table", "postgres", "mysql", "mongo", "redis", "neon", "supabase",
    "registro", "record", "schema",
  ],
  api_call: [
    "api", "servicio", "service", "integración", "integration", "webhook",
    "oauth", "token", "tercero", "third-party", "external", "externo",
    "slack", "github", "stripe", "openai", "anthropic",
  ],
  browser: [
    "screenshot", "captura", "renderizar", "render", "puppeteer",
    "playwright", "navegador", "browser", "visual", "pixel",
    "responsive", "viewport", "dom", "interact", "click",
  ],
  hybrid: [], // detected when multiple strategies score high
};

/** Keywords indicating domain knowledge is needed */
const DOMAIN_KEYWORDS: Record<string, string[]> = {
  ux_standards: [
    "ux", "usabilidad", "usability", "iso 9241", "iso 25010",
    "iso 25022", "iso 25023", "accesibilidad", "accessibility",
    "wcag", "heurísticas", "nielsen", "a11y",
  ],
  security_standards: [
    "owasp", "seguridad", "security", "vulnerability", "vulnerabilidad",
    "cve", "pentest", "audit", "pci", "gdpr",
  ],
  code_quality: [
    "solid", "clean code", "calidad", "quality", "métricas", "metrics",
    "complejidad", "complexity", "coverage", "cobertura", "lint",
  ],
  api_specs: [
    "openapi", "swagger", "graphql", "rest", "grpc", "schema",
    "endpoint", "specification", "especificación",
  ],
  data_formats: [
    "json", "xml", "csv", "yaml", "markdown", "html", "css",
    "typescript", "javascript", "python",
  ],
};

// ============================================================
// MAIN ANALYSIS FUNCTION
// ============================================================

/**
 * Analyze the project configuration to determine context requirements
 */
export function analyzeContext(config: McpProjectConfig): ContextAnalysis {
  const objectiveTokens = tokenize(config.objective);
  const descriptionTokens = tokenize(config.description);
  const allTokens = [...objectiveTokens, ...descriptionTokens];
  const skillNames = config.skills.map((s) => s.name.toLowerCase());

  // 1. Determine access strategy
  const strategyScores = calculateStrategyScores(allTokens, skillNames);
  const primaryStrategy = getPrimaryStrategy(strategyScores);
  const secondaryStrategies = getSecondaryStrategies(strategyScores, primaryStrategy);

  // 2. Determine if domain knowledge (Resources) are needed
  const domainMatches = detectDomainKnowledge(allTokens);
  const needsResources = domainMatches.length > 0;
  const suggestedResources = generateSuggestedResources(domainMatches, config);

  // 3. Generate warnings about potential context gaps
  const warnings = generateWarnings(primaryStrategy, config, domainMatches);

  // 4. Required dependencies
  const requiredDependencies = getDependencies(primaryStrategy, secondaryStrategies);

  // 5. Complexity
  const complexity = calculateComplexity(
    primaryStrategy,
    secondaryStrategies,
    suggestedResources.length,
    config.skills.length
  );

  return {
    primaryStrategy,
    secondaryStrategies,
    needsResources,
    suggestedResources,
    warnings,
    requiredDependencies,
    complexity,
  };
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/[\s,;.!?()[\]{}]+/)
    .filter((t) => t.length > 2);
}

function calculateStrategyScores(
  tokens: string[],
  skillNames: string[]
): Record<AccessStrategy, number> {
  const scores: Record<AccessStrategy, number> = {
    code_input: 0,
    filesystem: 0,
    url_fetch: 0,
    database: 0,
    api_call: 0,
    browser: 0,
    hybrid: 0,
  };

  const allText = [...tokens, ...skillNames].join(" ");

  for (const [strategy, keywords] of Object.entries(ACCESS_KEYWORDS)) {
    for (const keyword of keywords) {
      if (allText.includes(keyword.toLowerCase())) {
        scores[strategy as AccessStrategy] += 1;
      }
    }
  }

  return scores;
}

function getPrimaryStrategy(
  scores: Record<AccessStrategy, number>
): AccessStrategy {
  const entries = Object.entries(scores).filter(([key]) => key !== "hybrid");
  entries.sort((a, b) => b[1] - a[1]);

  if (entries[0][1] === 0) return "code_input"; // Default fallback
  return entries[0][0] as AccessStrategy;
}

function getSecondaryStrategies(
  scores: Record<AccessStrategy, number>,
  primary: AccessStrategy
): AccessStrategy[] {
  return Object.entries(scores)
    .filter(([key, score]) => key !== primary && key !== "hybrid" && score > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([key]) => key as AccessStrategy);
}

function detectDomainKnowledge(tokens: string[]): string[] {
  const allText = tokens.join(" ");
  const matches: string[] = [];

  for (const [domain, keywords] of Object.entries(DOMAIN_KEYWORDS)) {
    const matchCount = keywords.filter((kw) =>
      allText.includes(kw.toLowerCase())
    ).length;
    if (matchCount >= 2) {
      matches.push(domain);
    }
  }

  return matches;
}

function generateSuggestedResources(
  domains: string[],
  config: McpProjectConfig
): SuggestedResource[] {
  const resources: SuggestedResource[] = [];

  for (const domain of domains) {
    switch (domain) {
      case "ux_standards":
        resources.push({
          name: "ux-evaluation-criteria",
          description: "Criterios de evaluación ISO 9241/25010 traducidos a patrones verificables en código",
          type: "criteria",
          contentTemplate: generateUxCriteriaTemplate(),
        });
        break;
      case "security_standards":
        resources.push({
          name: "security-rules",
          description: "Reglas de seguridad OWASP Top 10 con patrones regex detectables",
          type: "criteria",
          contentTemplate: generateSecurityCriteriaTemplate(),
        });
        break;
      case "code_quality":
        resources.push({
          name: "quality-metrics",
          description: "Métricas de calidad de código (complejidad, cohesión, acoplamiento)",
          type: "criteria",
          contentTemplate: generateQualityCriteriaTemplate(),
        });
        break;
      case "api_specs":
        resources.push({
          name: "api-specification",
          description: "Especificación de la API que el MCP consume o valida",
          type: "schema",
          contentTemplate: `// TODO: User should provide their OpenAPI/GraphQL schema here\n// This resource gives the AI context about the API structure`,
        });
        break;
      case "data_formats":
        resources.push({
          name: "format-reference",
          description: "Referencia de formato de datos esperado",
          type: "reference",
          contentTemplate: `// Reference data format for validation\n// Customize based on your specific data structure`,
        });
        break;
    }
  }

  return resources;
}

function generateWarnings(
  strategy: AccessStrategy,
  config: McpProjectConfig,
  domains: string[]
): ContextWarning[] {
  const warnings: ContextWarning[] = [];

  // Warning: Evaluation-type MCP without Resources
  if (
    domains.length > 0 &&
    config.objective.match(/evaluar|evaluate|analizar|analyze|verificar|check/i)
  ) {
    if (strategy !== "code_input" && strategy !== "filesystem") {
      warnings.push({
        severity: "critical",
        title: "MCP de evaluación sin acceso al código",
        description:
          "Este MCP necesita evaluar/analizar algo, pero la estrategia de acceso elegida no le permite obtener el código fuente.",
        recommendation:
          "Cambiar estrategia a 'code_input' (el AI pasa el código) o 'filesystem' (el MCP lee archivos). Un MCP NO puede 'ver' una URL por sí solo.",
      });
    }
  }

  // Warning: Domain knowledge needed but no Resources
  if (domains.length > 0) {
    warnings.push({
      severity: "warning",
      title: "Se necesita conocimiento de dominio",
      description: `Este MCP evalúa contra estándares (${domains.join(", ")}). Sin criterios concretos embebidos, el AI no sabrá qué verificar.`,
      recommendation:
        "Se generarán Resources con los criterios de evaluación para que el AI tenga contexto completo.",
    });
  }

  // Warning: URL strategy without browser
  if (strategy === "url_fetch") {
    warnings.push({
      severity: "info",
      title: "Acceso por URL solo obtiene HTML crudo",
      description:
        "Fetch de URL obtiene HTML servidor pero no ejecuta JavaScript. SPAs pueden devolver HTML vacío.",
      recommendation:
        "Si la página usa React/Vue/Angular, considerar estrategia 'browser' (Puppeteer) para obtener el DOM renderizado.",
    });
  }

  // Warning: No skills defined
  if (config.skills.length === 0) {
    warnings.push({
      severity: "critical",
      title: "Sin herramientas definidas",
      description: "El MCP no tiene ninguna herramienta. No podrá hacer nada útil.",
      recommendation: "Agregar al menos una herramienta (tool) con lógica concreta.",
    });
  }

  return warnings;
}

function getDependencies(
  primary: AccessStrategy,
  secondary: AccessStrategy[]
): string[] {
  const deps: Set<string> = new Set([
    "@modelcontextprotocol/sdk",
    "zod",
  ]);

  const strategyDeps: Record<AccessStrategy, string[]> = {
    code_input: [],
    filesystem: ["fs/promises"],
    url_fetch: [],
    database: ["@neondatabase/serverless"],
    api_call: [],
    browser: ["puppeteer"],
    hybrid: [],
  };

  for (const d of strategyDeps[primary] || []) deps.add(d);
  for (const s of secondary) {
    for (const d of strategyDeps[s] || []) deps.add(d);
  }

  return [...deps];
}

function calculateComplexity(
  primary: AccessStrategy,
  secondary: AccessStrategy[],
  resourceCount: number,
  skillCount: number
): number {
  let score = 1;
  if (primary === "browser") score += 2;
  else if (primary === "database" || primary === "api_call") score += 1;
  score += secondary.length * 0.5;
  score += resourceCount * 0.3;
  score += Math.min(skillCount * 0.2, 1);
  return Math.min(5, Math.round(score));
}

// ============================================================
// RESOURCE CONTENT TEMPLATES
// ============================================================

function generateUxCriteriaTemplate(): string {
  return `{
  "standard": "ISO 9241 + ISO 25010 + ISO 25022",
  "criteria": [
    {
      "id": "UX-001",
      "standard": "ISO 9241-210",
      "name": "Responsive Design",
      "check": "meta[name=viewport] present, @media queries exist",
      "severity": "critical"
    },
    {
      "id": "UX-002",
      "standard": "ISO 9241-210",
      "name": "Semantic HTML",
      "check": "header, main, nav, footer elements present",
      "severity": "major"
    },
    {
      "id": "UX-003",
      "standard": "ISO 9241-11",
      "name": "Keyboard Accessibility",
      "check": ":focus/:focus-visible styles defined",
      "severity": "critical"
    },
    {
      "id": "UX-004",
      "standard": "ISO 9241-11",
      "name": "Form Labels",
      "check": "all inputs have associated label or aria-label",
      "severity": "major"
    },
    {
      "id": "UX-005",
      "standard": "ISO 25010",
      "name": "Image Alt Text",
      "check": "all img elements have alt attribute",
      "severity": "critical"
    },
    {
      "id": "UX-006",
      "standard": "ISO 25010",
      "name": "Color Contrast",
      "check": "text/background contrast ratio >= 4.5:1",
      "severity": "critical"
    },
    {
      "id": "UX-007",
      "standard": "ISO 25010",
      "name": "Single H1",
      "check": "exactly one h1 element present",
      "severity": "major"
    },
    {
      "id": "UX-008",
      "standard": "ISO 25022",
      "name": "Performance Loading",
      "check": "images have loading=lazy, scripts have defer/async",
      "severity": "major"
    },
    {
      "id": "UX-009",
      "standard": "ISO 9241-210",
      "name": "Language Declaration",
      "check": "html[lang] attribute present",
      "severity": "major"
    },
    {
      "id": "UX-010",
      "standard": "ISO 25010",
      "name": "Reduced Motion",
      "check": "@media (prefers-reduced-motion) defined if animations exist",
      "severity": "major"
    }
  ]
}`;
}

function generateSecurityCriteriaTemplate(): string {
  return `{
  "standard": "OWASP Top 10 2021",
  "criteria": [
    { "id": "SEC-001", "name": "No eval()", "pattern": "eval\\\\(", "severity": "critical" },
    { "id": "SEC-002", "name": "No hardcoded secrets", "pattern": "(password|secret|api_key)\\\\s*[:=]", "severity": "critical" },
    { "id": "SEC-003", "name": "Parameterized queries", "pattern": "query\\\\(.*\\\\+|query\\\\(.*\\\\$\\\\{", "severity": "critical" },
    { "id": "SEC-004", "name": "Input validation", "pattern": "req\\\\.(body|params|query)\\\\.", "severity": "high" },
    { "id": "SEC-005", "name": "No path traversal", "pattern": "\\\\.\\\\./", "severity": "high" }
  ]
}`;
}

function generateQualityCriteriaTemplate(): string {
  return `{
  "standard": "Code Quality Metrics",
  "criteria": [
    { "id": "QA-001", "name": "Function length", "threshold": "max 30 lines per function", "severity": "major" },
    { "id": "QA-002", "name": "Cyclomatic complexity", "threshold": "max 10 per function", "severity": "major" },
    { "id": "QA-003", "name": "Nesting depth", "threshold": "max 4 levels", "severity": "minor" },
    { "id": "QA-004", "name": "File length", "threshold": "max 300 lines per file", "severity": "minor" },
    { "id": "QA-005", "name": "Type safety", "threshold": "no any types", "severity": "major" }
  ]
}`;
}

// ============================================================
// EXPORT UTILITY
// ============================================================

/**
 * Get human-readable description of strategy
 */
export function getStrategyDescription(strategy: AccessStrategy): string {
  const descriptions: Record<AccessStrategy, string> = {
    code_input:
      "El AI le pasa el código fuente directamente al MCP como string. El MCP analiza el texto sin necesitar acceso al filesystem.",
    filesystem:
      "El MCP lee archivos directamente del disco local. Necesita paths permitidos y validación de seguridad.",
    url_fetch:
      "El MCP obtiene contenido de URLs usando fetch/HTTP. Solo obtiene HTML crudo (no ejecuta JS).",
    database:
      "El MCP se conecta a una base de datos para leer/escribir información.",
    api_call:
      "El MCP llama APIs externas (REST/GraphQL) para obtener o enviar datos.",
    browser:
      "El MCP usa un navegador headless (Puppeteer/Playwright) para renderizar páginas y obtener el DOM completo.",
    hybrid:
      "Combinación de múltiples estrategias según la operación.",
  };
  return descriptions[strategy];
}
