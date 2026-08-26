/**
 * UX Evaluation Knowledge Module
 * 
 * Contains the ISO standards translated into executable evaluation
 * criteria that an MCP can actually verify against code.
 * 
 * Standards covered:
 * - ISO 9241-210: Human-centred design for interactive systems
 * - ISO 9241-11: Usability (effectiveness, efficiency, satisfaction)
 * - ISO 25010: Systems/software quality (usability characteristics)
 * - ISO 25022: Measurement of quality in use
 * - ISO 25023: Measurement of system/software product quality
 */

// ============================================================
// EVALUATION MATRICES - Concrete, measurable criteria
// ============================================================

export interface UxCriterion {
  id: string;
  isoStandard: string;
  category: string;
  name: string;
  description: string;
  howToMeasure: string;
  threshold: string;
  codePattern: string; // What to look for in HTML/CSS
  severity: "critical" | "major" | "minor" | "suggestion";
}

/**
 * ISO 9241-11: Usability Metrics
 * Effectiveness, Efficiency, Satisfaction
 */
export const ISO_9241_11_CRITERIA: UxCriterion[] = [
  {
    id: "9241-11-001",
    isoStandard: "ISO 9241-11",
    category: "Effectiveness",
    name: "Task completion indicators",
    description: "El usuario debe poder identificar claramente cuándo una tarea se ha completado",
    howToMeasure: "Verificar presencia de mensajes de éxito/error, estados visuales de completado",
    threshold: "100% de formularios deben tener feedback de envío",
    codePattern: "form[action] must have adjacent .success-message or aria-live region",
    severity: "major",
  },
  {
    id: "9241-11-002",
    isoStandard: "ISO 9241-11",
    category: "Effectiveness",
    name: "Error prevention",
    description: "El sistema debe prevenir errores antes de que ocurran",
    howToMeasure: "Verificar validación inline, labels claros, placeholders informativos",
    threshold: "Todos los inputs deben tener label asociado + validation",
    codePattern: "input must have associated label[for] or aria-label, type attribute must be specific",
    severity: "major",
  },
  {
    id: "9241-11-003",
    isoStandard: "ISO 9241-11",
    category: "Efficiency",
    name: "Navigation efficiency",
    description: "El usuario debe poder llegar a cualquier función principal en máximo 3 clicks",
    howToMeasure: "Contar profundidad de navegación, verificar breadcrumbs, accesos directos",
    threshold: "nav principal visible, máximo 3 niveles de profundidad",
    codePattern: "nav element present, max nesting depth of links ≤ 3, skip-to-content link present",
    severity: "minor",
  },
  {
    id: "9241-11-004",
    isoStandard: "ISO 9241-11",
    category: "Efficiency",
    name: "Keyboard accessibility",
    description: "Toda funcionalidad debe ser accesible por teclado",
    howToMeasure: "Verificar tabindex, focus styles, event handlers de teclado",
    threshold: "100% de elementos interactivos deben ser focusables",
    codePattern: "interactive elements must have tabindex or be natively focusable, :focus styles must exist",
    severity: "critical",
  },
  {
    id: "9241-11-005",
    isoStandard: "ISO 9241-11",
    category: "Satisfaction",
    name: "Visual consistency",
    description: "La interfaz debe mantener consistencia visual en toda la aplicación",
    howToMeasure: "Verificar uso de variables CSS, sistema de diseño coherente",
    threshold: "Uso de custom properties (--var) para colores, espaciado, tipografía",
    codePattern: "CSS must use custom properties (var(--)), consistent spacing scale, font-family defined once",
    severity: "minor",
  },
];

/**
 * ISO 9241-210: Human-Centred Design Process
 * Evaluable through code artifacts
 */
export const ISO_9241_210_CRITERIA: UxCriterion[] = [
  {
    id: "9241-210-001",
    isoStandard: "ISO 9241-210",
    category: "Context of Use",
    name: "Responsive design",
    description: "La interfaz debe adaptarse al contexto de uso (dispositivo, tamaño de pantalla)",
    howToMeasure: "Verificar media queries, viewport meta, unidades relativas",
    threshold: "Mínimo breakpoints para mobile (≤768px) y desktop (≥1024px)",
    codePattern: "meta[name=viewport] present, @media queries for mobile/tablet/desktop, relative units (rem/em/%/vw/vh)",
    severity: "critical",
  },
  {
    id: "9241-210-002",
    isoStandard: "ISO 9241-210",
    category: "User Requirements",
    name: "Language and locale",
    description: "La interfaz debe declarar su idioma para tecnologías asistivas",
    howToMeasure: "Verificar atributo lang en html, etiquetas hreflang si es multiidioma",
    threshold: "html[lang] debe estar presente y ser válido",
    codePattern: "html[lang] attribute present with valid BCP 47 tag",
    severity: "major",
  },
  {
    id: "9241-210-003",
    isoStandard: "ISO 9241-210",
    category: "Design Solutions",
    name: "Touch target size",
    description: "Los elementos interactivos deben tener tamaño adecuado para touch",
    howToMeasure: "Verificar min-width/min-height de botones y links en mobile",
    threshold: "Mínimo 44x44px (WCAG) o 48x48px (Material Design) para targets touch",
    codePattern: "button/a/input min-width ≥ 44px, min-height ≥ 44px, padding sufficient",
    severity: "major",
  },
  {
    id: "9241-210-004",
    isoStandard: "ISO 9241-210",
    category: "Evaluation",
    name: "Semantic HTML structure",
    description: "La estructura HTML debe comunicar la semántica del contenido",
    howToMeasure: "Verificar uso correcto de header, main, nav, footer, section, article, aside",
    threshold: "Landmarks semánticos presentes: header, main, nav como mínimo",
    codePattern: "semantic elements: <header>, <main>, <nav>, <footer> present; no div-only structure",
    severity: "major",
  },
];

/**
 * ISO 25010: Software Quality - Usability Characteristics
 */
export const ISO_25010_CRITERIA: UxCriterion[] = [
  {
    id: "25010-001",
    isoStandard: "ISO 25010",
    category: "Appropriateness Recognizability",
    name: "Clear purpose communication",
    description: "El usuario debe reconocer inmediatamente si el sistema es apropiado para su necesidad",
    howToMeasure: "Verificar presencia de heading principal, meta description, hero section descriptiva",
    threshold: "h1 visible con propósito claro, meta description presente",
    codePattern: "exactly one <h1> describing purpose, meta[name=description] present, hero/intro section visible",
    severity: "major",
  },
  {
    id: "25010-002",
    isoStandard: "ISO 25010",
    category: "Learnability",
    name: "Progressive disclosure",
    description: "La interfaz no debe abrumar con toda la información a la vez",
    howToMeasure: "Verificar uso de acordeones, tabs, tooltips, modales para contenido secundario",
    threshold: "Contenido organizado en secciones, no todo visible simultáneamente",
    codePattern: "use of details/summary, accordion patterns, tabs, or progressive reveal",
    severity: "minor",
  },
  {
    id: "25010-003",
    isoStandard: "ISO 25010",
    category: "Operability",
    name: "Consistent interaction patterns",
    description: "Los patrones de interacción deben ser consistentes en toda la aplicación",
    howToMeasure: "Verificar consistencia de botones, links, formularios",
    threshold: "Un solo estilo de botón primario, un solo patrón de form, navegación consistente",
    codePattern: "button styles consistent (same classes/styles), form patterns uniform",
    severity: "minor",
  },
  {
    id: "25010-004",
    isoStandard: "ISO 25010",
    category: "User Error Protection",
    name: "Confirmation for destructive actions",
    description: "Las acciones destructivas deben requerir confirmación",
    howToMeasure: "Verificar modales de confirmación antes de delete/remove/cancel",
    threshold: "100% de acciones destructivas deben tener confirmación",
    codePattern: "delete/remove buttons must trigger confirmation dialog, not direct action",
    severity: "critical",
  },
  {
    id: "25010-005",
    isoStandard: "ISO 25010",
    category: "Accessibility",
    name: "Color contrast ratio",
    description: "El texto debe tener suficiente contraste con el fondo para ser legible",
    howToMeasure: "Calcular ratio de contraste entre color de texto y fondo",
    threshold: "Ratio ≥ 4.5:1 para texto normal, ≥ 3:1 para texto grande (WCAG AA)",
    codePattern: "computed color vs background-color contrast ratio meets WCAG AA",
    severity: "critical",
  },
  {
    id: "25010-006",
    isoStandard: "ISO 25010",
    category: "Accessibility",
    name: "Alt text for images",
    description: "Todas las imágenes informativas deben tener texto alternativo",
    howToMeasure: "Verificar atributo alt en img, role en SVG decorativos",
    threshold: "100% de img deben tener alt (vacío para decorativas)",
    codePattern: "all <img> must have alt attribute; decorative images: alt=\"\" or role=\"presentation\"",
    severity: "critical",
  },
];

/**
 * ISO 25022: Quality in Use Metrics
 * (measured through code patterns that ENABLE measurement)
 */
export const ISO_25022_CRITERIA: UxCriterion[] = [
  {
    id: "25022-001",
    isoStandard: "ISO 25022",
    category: "Effectiveness",
    name: "Task completion tracking capability",
    description: "El sistema debe poder medir si los usuarios completan sus tareas",
    howToMeasure: "Verificar presencia de analytics, event tracking, o logging",
    threshold: "Al menos un sistema de tracking implementado",
    codePattern: "analytics script present (gtag, plausible, posthog) or custom event logging",
    severity: "suggestion",
  },
  {
    id: "25022-002",
    isoStandard: "ISO 25022",
    category: "Efficiency",
    name: "Performance budget",
    description: "El tiempo de carga impacta directamente la eficiencia del usuario",
    howToMeasure: "Verificar optimizaciones de carga: lazy loading, code splitting, image optimization",
    threshold: "Imágenes con loading=lazy, scripts con defer/async, CSS critical inlined",
    codePattern: "img[loading=lazy], script[defer|async], link[rel=preload] for critical resources",
    severity: "major",
  },
  {
    id: "25022-003",
    isoStandard: "ISO 25022",
    category: "Satisfaction",
    name: "Loading state feedback",
    description: "El usuario debe percibir que el sistema responde mientras carga",
    howToMeasure: "Verificar spinners, skeletons, progress bars durante operaciones async",
    threshold: "Toda operación >300ms debe tener indicador de carga",
    codePattern: "loading states present: spinner/skeleton/progress components, aria-busy usage",
    severity: "major",
  },
];

/**
 * ISO 25023: Internal Quality Metrics for UX
 */
export const ISO_25023_CRITERIA: UxCriterion[] = [
  {
    id: "25023-001",
    isoStandard: "ISO 25023",
    category: "Maintainability",
    name: "Component-based architecture",
    description: "La UI debe estar organizada en componentes reutilizables",
    howToMeasure: "Verificar estructura de componentes, design tokens, CSS modular",
    threshold: "Uso de componentes (React/Vue/etc) o clases CSS reutilizables",
    codePattern: "component files present, BEM/utility classes, or CSS modules",
    severity: "minor",
  },
  {
    id: "25023-002",
    isoStandard: "ISO 25023",
    category: "Portability",
    name: "Cross-browser compatibility",
    description: "La interfaz debe funcionar en los navegadores principales",
    howToMeasure: "Verificar uso de features con soporte amplio, polyfills, prefijos vendor",
    threshold: "No usar features exclusivas sin fallback, autoprefixer o equivalente",
    codePattern: "no experimental CSS without fallback, standard HTML5, progressive enhancement",
    severity: "minor",
  },
];

// ============================================================
// ALL CRITERIA COMBINED
// ============================================================

export const ALL_UX_CRITERIA: UxCriterion[] = [
  ...ISO_9241_11_CRITERIA,
  ...ISO_9241_210_CRITERIA,
  ...ISO_25010_CRITERIA,
  ...ISO_25022_CRITERIA,
  ...ISO_25023_CRITERIA,
];

/**
 * Get criteria by standard
 */
export function getCriteriaByStandard(standard: string): UxCriterion[] {
  return ALL_UX_CRITERIA.filter((c) => c.isoStandard === standard);
}

/**
 * Get criteria by severity
 */
export function getCriteriaBySeverity(severity: UxCriterion["severity"]): UxCriterion[] {
  return ALL_UX_CRITERIA.filter((c) => c.severity === severity);
}

/**
 * Generate evaluation prompt for AI
 * This is the KEY insight: the MCP should provide this context
 * so the AI knows HOW to evaluate the code it receives
 */
export function generateEvaluationPrompt(criteria: UxCriterion[]): string {
  return `## Criterios de Evaluación UX

Evalúa el siguiente código HTML/CSS contra estos criterios específicos.
Para cada criterio, indica: PASS ✅, FAIL ❌, o N/A ⚪

${criteria
  .map(
    (c) => `### [${c.id}] ${c.name} (${c.isoStandard} - ${c.severity.toUpperCase()})
- **Qué verificar**: ${c.howToMeasure}
- **Umbral**: ${c.threshold}
- **Patrón en código**: ${c.codePattern}
`
  )
  .join("\n")}
`;
}
