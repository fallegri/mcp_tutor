#!/usr/bin/env node
/**
 * UX Evaluator MCP Server
 * 
 * EJEMPLO FUNCIONAL de un MCP que evalúa código frontend
 * contra normas ISO de UX/Usabilidad.
 * 
 * ⚠️ CLAVE: Este MCP recibe CÓDIGO (HTML/CSS/JSX) como input,
 * NO una URL. El AI es quien obtiene el código y se lo pasa.
 * 
 * Standards: ISO 9241-210, 9241-11, 25010, 25022, 25023
 * 
 * Estrategia: Análisis estático del código fuente
 * - Parsea HTML para verificar estructura semántica
 * - Analiza CSS para verificar accesibilidad visual
 * - Evalúa contra criterios concretos y medibles
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// ============================================================
// EVALUATION CRITERIA (the missing context!)
// ============================================================

interface EvalResult {
  id: string;
  standard: string;
  criterion: string;
  status: "pass" | "fail" | "warning" | "na";
  severity: "critical" | "major" | "minor" | "suggestion";
  details: string;
  recommendation?: string;
}

// ============================================================
// MCP SERVER
// ============================================================

const server = new McpServer({
  name: "ux-evaluator",
  version: "1.0.0",
});

// ============================================================
// RESOURCE: Evaluation Criteria Reference
// This gives the AI context about WHAT to evaluate
// ============================================================

server.resource(
  "ux-criteria",
  "ux-criteria://all",
  async () => ({
    contents: [
      {
        uri: "ux-criteria://all",
        text: JSON.stringify(EVALUATION_CRITERIA, null, 2),
        mimeType: "application/json",
      },
    ],
  })
);

// ============================================================
// TOOL 1: evaluate_html
// Evaluates HTML code against ISO UX criteria
// ============================================================

server.tool(
  "evaluate_html",
  "Evalúa código HTML contra normas ISO de UX (9241-210, 9241-11, 25010). Recibe el código HTML completo o parcial.",
  {
    html: z.string().min(10).max(100000).describe("Código HTML a evaluar"),
    context: z.string().optional().describe("Contexto adicional: tipo de página (landing, dashboard, form, etc.)"),
  },
  async ({ html, context }) => {
    const results: EvalResult[] = [];

    // === ISO 9241-210: Responsive & Context ===
    
    // Check viewport meta
    if (!html.includes('name="viewport"') && !html.includes("name='viewport'")) {
      results.push({
        id: "9241-210-001",
        standard: "ISO 9241-210",
        criterion: "Responsive Design - Viewport",
        status: "fail",
        severity: "critical",
        details: "No se encontró <meta name=\"viewport\">. La página no se adaptará a dispositivos móviles.",
        recommendation: "Agregar: <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">",
      });
    } else {
      results.push({
        id: "9241-210-001",
        standard: "ISO 9241-210",
        criterion: "Responsive Design - Viewport",
        status: "pass",
        severity: "critical",
        details: "Meta viewport presente.",
      });
    }

    // Check lang attribute
    const langMatch = html.match(/<html[^>]*lang=["']([^"']+)["']/);
    if (!langMatch) {
      results.push({
        id: "9241-210-002",
        standard: "ISO 9241-210",
        criterion: "Language Declaration",
        status: "fail",
        severity: "major",
        details: "No se encontró atributo lang en <html>. Tecnologías asistivas no pueden determinar el idioma.",
        recommendation: "Agregar: <html lang=\"es\"> (o el idioma correspondiente)",
      });
    } else {
      results.push({
        id: "9241-210-002",
        standard: "ISO 9241-210",
        criterion: "Language Declaration",
        status: "pass",
        severity: "major",
        details: `Idioma declarado: ${langMatch[1]}`,
      });
    }

    // === ISO 9241-11: Effectiveness ===

    // Check semantic structure
    const hasHeader = /<header/i.test(html);
    const hasMain = /<main/i.test(html);
    const hasNav = /<nav/i.test(html);
    const hasFooter = /<footer/i.test(html);
    const semanticScore = [hasHeader, hasMain, hasNav, hasFooter].filter(Boolean).length;

    results.push({
      id: "9241-210-004",
      standard: "ISO 9241-210",
      criterion: "Semantic HTML Structure",
      status: semanticScore >= 3 ? "pass" : semanticScore >= 2 ? "warning" : "fail",
      severity: "major",
      details: `Landmarks semánticos: header(${hasHeader ? "✅" : "❌"}) main(${hasMain ? "✅" : "❌"}) nav(${hasNav ? "✅" : "❌"}) footer(${hasFooter ? "✅" : "❌"})`,
      recommendation: semanticScore < 3
        ? "Usar elementos semánticos: <header>, <main>, <nav>, <footer> en lugar de <div> genéricos"
        : undefined,
    });

    // Check h1 presence (single)
    const h1Matches = html.match(/<h1/gi);
    if (!h1Matches) {
      results.push({
        id: "25010-001",
        standard: "ISO 25010",
        criterion: "Clear Purpose (h1)",
        status: "fail",
        severity: "major",
        details: "No se encontró <h1>. La página no comunica su propósito principal.",
        recommendation: "Agregar un único <h1> que describa el propósito de la página",
      });
    } else if (h1Matches.length > 1) {
      results.push({
        id: "25010-001",
        standard: "ISO 25010",
        criterion: "Clear Purpose (h1)",
        status: "warning",
        severity: "major",
        details: `Se encontraron ${h1Matches.length} elementos <h1>. Debe haber exactamente 1.`,
        recommendation: "Mantener solo un <h1> por página. Usar <h2>-<h6> para subtítulos.",
      });
    } else {
      results.push({
        id: "25010-001",
        standard: "ISO 25010",
        criterion: "Clear Purpose (h1)",
        status: "pass",
        severity: "major",
        details: "Un único <h1> presente.",
      });
    }

    // Check images alt text
    const images = html.match(/<img[^>]*>/gi) || [];
    const imagesWithoutAlt = images.filter(
      (img) => !img.includes("alt=")
    );
    if (images.length > 0) {
      results.push({
        id: "25010-006",
        standard: "ISO 25010",
        criterion: "Alt Text for Images",
        status: imagesWithoutAlt.length === 0 ? "pass" : "fail",
        severity: "critical",
        details: `${images.length} imágenes encontradas, ${imagesWithoutAlt.length} sin atributo alt.`,
        recommendation: imagesWithoutAlt.length > 0
          ? "Agregar alt descriptivo a imágenes informativas. Usar alt=\"\" para decorativas."
          : undefined,
      });
    }

    // Check form labels
    const inputs = html.match(/<input[^>]*>/gi) || [];
    const inputsWithoutLabel = inputs.filter(
      (input) =>
        !input.includes("aria-label") &&
        !input.includes("aria-labelledby") &&
        input.includes('type=') &&
        !input.includes('type="hidden"') &&
        !input.includes('type="submit"')
    );
    // Simple check: count labels vs inputs
    const labels = html.match(/<label/gi) || [];
    const visibleInputs = inputs.filter(
      (i) => !i.includes('type="hidden"') && !i.includes('type="submit"')
    );

    if (visibleInputs.length > 0) {
      const hasAdequateLabels = labels.length >= visibleInputs.length * 0.8;
      results.push({
        id: "9241-11-002",
        standard: "ISO 9241-11",
        criterion: "Form Labels (Error Prevention)",
        status: hasAdequateLabels ? "pass" : "fail",
        severity: "major",
        details: `${visibleInputs.length} inputs visibles, ${labels.length} labels encontrados.`,
        recommendation: !hasAdequateLabels
          ? "Cada input debe tener un <label for=\"id\"> asociado o aria-label."
          : undefined,
      });
    }

    // Check keyboard accessibility indicators
    const hasFocusStyles =
      html.includes(":focus") ||
      html.includes(":focus-visible") ||
      html.includes("focus:");
    results.push({
      id: "9241-11-004",
      standard: "ISO 9241-11",
      criterion: "Keyboard Accessibility (Focus Styles)",
      status: hasFocusStyles ? "pass" : "warning",
      severity: "critical",
      details: hasFocusStyles
        ? "Estilos de focus detectados."
        : "No se detectaron estilos :focus o :focus-visible en el código.",
      recommendation: !hasFocusStyles
        ? "Agregar estilos :focus-visible para todos los elementos interactivos."
        : undefined,
    });

    // Check skip-to-content link
    const hasSkipLink =
      html.includes("skip-to") ||
      html.includes("skip-nav") ||
      html.includes("skipnav") ||
      html.includes("#main-content") ||
      html.includes("#content");
    results.push({
      id: "9241-11-003",
      standard: "ISO 9241-11",
      criterion: "Skip Navigation Link",
      status: hasSkipLink ? "pass" : "warning",
      severity: "minor",
      details: hasSkipLink
        ? "Skip-to-content link detectado."
        : "No se encontró link de 'skip to content' para usuarios de teclado.",
      recommendation: !hasSkipLink
        ? "Agregar: <a href=\"#main-content\" class=\"skip-link\">Saltar al contenido</a>"
        : undefined,
    });

    // === ISO 25022: Performance ===
    
    // Check lazy loading
    const allImages = html.match(/<img[^>]*>/gi) || [];
    const lazyImages = allImages.filter((img) => img.includes('loading="lazy"'));
    if (allImages.length > 3) {
      results.push({
        id: "25022-002",
        standard: "ISO 25022",
        criterion: "Performance - Lazy Loading",
        status: lazyImages.length >= allImages.length * 0.5 ? "pass" : "warning",
        severity: "major",
        details: `${lazyImages.length}/${allImages.length} imágenes con loading="lazy".`,
        recommendation: lazyImages.length < allImages.length * 0.5
          ? "Agregar loading=\"lazy\" a imágenes que no son above-the-fold."
          : undefined,
      });
    }

    // Check script loading
    const scripts = html.match(/<script[^>]*>/gi) || [];
    const blockingScripts = scripts.filter(
      (s) => !s.includes("defer") && !s.includes("async") && !s.includes("type=\"module\"")
    );
    if (scripts.length > 0) {
      results.push({
        id: "25022-002b",
        standard: "ISO 25022",
        criterion: "Performance - Script Loading",
        status: blockingScripts.length === 0 ? "pass" : "warning",
        severity: "major",
        details: `${blockingScripts.length}/${scripts.length} scripts sin defer/async (bloquean renderizado).`,
        recommendation: blockingScripts.length > 0
          ? "Agregar defer o async a scripts, o usar type=\"module\"."
          : undefined,
      });
    }

    // === Calculate overall score ===
    const totalChecks = results.length;
    const passed = results.filter((r) => r.status === "pass").length;
    const failed = results.filter((r) => r.status === "fail").length;
    const warnings = results.filter((r) => r.status === "warning").length;
    const criticalFails = results.filter(
      (r) => r.status === "fail" && r.severity === "critical"
    ).length;

    const score = Math.round(
      ((passed + warnings * 0.5) / totalChecks) * 100
    );

    const summary = `
## 📊 Reporte de Evaluación UX

**Score General: ${score}/100** ${score >= 80 ? "✅" : score >= 60 ? "⚠️" : "❌"}

| Métrica | Valor |
|---------|-------|
| Criterios evaluados | ${totalChecks} |
| Aprobados ✅ | ${passed} |
| Fallidos ❌ | ${failed} |
| Advertencias ⚠️ | ${warnings} |
| Críticos pendientes | ${criticalFails} |

### Resultados por Norma ISO:

${results
  .map(
    (r) =>
      `- [${r.status === "pass" ? "✅" : r.status === "fail" ? "❌" : "⚠️"}] **${r.criterion}** (${r.standard}) - ${r.details}${r.recommendation ? `\n  → ${r.recommendation}` : ""}`
  )
  .join("\n")}

### Resumen por ISO:
- **ISO 9241-210** (Diseño centrado en humanos): ${results.filter((r) => r.standard === "ISO 9241-210" && r.status === "pass").length}/${results.filter((r) => r.standard === "ISO 9241-210").length} criterios
- **ISO 9241-11** (Usabilidad): ${results.filter((r) => r.standard === "ISO 9241-11" && r.status === "pass").length}/${results.filter((r) => r.standard === "ISO 9241-11").length} criterios
- **ISO 25010** (Calidad de producto): ${results.filter((r) => r.standard === "ISO 25010" && r.status === "pass").length}/${results.filter((r) => r.standard === "ISO 25010").length} criterios
- **ISO 25022** (Calidad en uso): ${results.filter((r) => r.standard === "ISO 25022" && r.status === "pass").length}/${results.filter((r) => r.standard === "ISO 25022").length} criterios
`;

    return {
      content: [{ type: "text", text: summary }],
    };
  }
);

// ============================================================
// TOOL 2: evaluate_css
// Evaluates CSS for UX-related properties
// ============================================================

server.tool(
  "evaluate_css",
  "Evalúa código CSS contra criterios de usabilidad ISO (contraste, responsive, accesibilidad visual)",
  {
    css: z.string().min(5).max(100000).describe("Código CSS a evaluar"),
  },
  async ({ css }) => {
    const results: EvalResult[] = [];

    // Check for media queries (responsive)
    const mediaQueries = css.match(/@media[^{]+/g) || [];
    const hasResponsive = mediaQueries.length > 0;
    results.push({
      id: "css-001",
      standard: "ISO 9241-210",
      criterion: "Responsive Breakpoints",
      status: hasResponsive ? "pass" : "fail",
      severity: "critical",
      details: `${mediaQueries.length} media queries encontradas.${hasResponsive ? " Breakpoints: " + mediaQueries.slice(0, 3).join(", ") : ""}`,
      recommendation: !hasResponsive
        ? "Agregar media queries para adaptar el diseño a diferentes tamaños de pantalla."
        : undefined,
    });

    // Check for focus styles
    const hasFocusStyles = css.includes(":focus") || css.includes(":focus-visible");
    results.push({
      id: "css-002",
      standard: "ISO 9241-11",
      criterion: "Focus Styles Defined",
      status: hasFocusStyles ? "pass" : "fail",
      severity: "critical",
      details: hasFocusStyles
        ? "Estilos :focus/:focus-visible definidos."
        : "No hay estilos para :focus. Usuarios de teclado no verán qué elemento está activo.",
      recommendation: !hasFocusStyles
        ? "Agregar: :focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }"
        : undefined,
    });

    // Check for CSS custom properties (design system consistency)
    const customProps = css.match(/--[a-zA-Z-]+/g) || [];
    const uniqueProps = [...new Set(customProps)];
    results.push({
      id: "css-003",
      standard: "ISO 9241-11",
      criterion: "Visual Consistency (Design Tokens)",
      status: uniqueProps.length >= 3 ? "pass" : "warning",
      severity: "minor",
      details: `${uniqueProps.length} custom properties (variables CSS) encontradas.`,
      recommendation: uniqueProps.length < 3
        ? "Usar CSS custom properties (--color-primary, --spacing-md, etc.) para mantener consistencia."
        : undefined,
    });

    // Check for relative units
    const pxValues = css.match(/\d+px/g) || [];
    const remValues = css.match(/\d+\.?\d*rem/g) || [];
    const emValues = css.match(/\d+\.?\d*em/g) || [];
    const relativeRatio = (remValues.length + emValues.length) / 
      Math.max(1, pxValues.length + remValues.length + emValues.length);
    
    results.push({
      id: "css-004",
      standard: "ISO 9241-210",
      criterion: "Relative Units Usage",
      status: relativeRatio >= 0.5 ? "pass" : relativeRatio >= 0.25 ? "warning" : "fail",
      severity: "major",
      details: `Unidades: ${pxValues.length} px, ${remValues.length} rem, ${emValues.length} em. Ratio relativo: ${Math.round(relativeRatio * 100)}%`,
      recommendation: relativeRatio < 0.5
        ? "Preferir rem/em sobre px para tipografía y espaciado. Permite que el usuario ajuste el tamaño base."
        : undefined,
    });

    // Check for reduced motion support
    const hasReducedMotion = css.includes("prefers-reduced-motion");
    const hasAnimations = css.includes("animation") || css.includes("transition");
    if (hasAnimations) {
      results.push({
        id: "css-005",
        standard: "ISO 25010",
        criterion: "Reduced Motion Support",
        status: hasReducedMotion ? "pass" : "warning",
        severity: "major",
        details: hasReducedMotion
          ? "Soporte para prefers-reduced-motion detectado."
          : "Hay animaciones pero no se respeta prefers-reduced-motion.",
        recommendation: !hasReducedMotion
          ? "Agregar: @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: 0.01ms !important; } }"
          : undefined,
      });
    }

    // Score
    const passed = results.filter((r) => r.status === "pass").length;
    const total = results.length;
    const score = Math.round((passed / total) * 100);

    const summary = `## 🎨 Evaluación CSS - UX\n\n**Score: ${score}/100**\n\n${results
      .map(
        (r) => `- [${r.status === "pass" ? "✅" : r.status === "fail" ? "❌" : "⚠️"}] ${r.criterion}: ${r.details}${r.recommendation ? `\n  → ${r.recommendation}` : ""}`
      )
      .join("\n")}`;

    return { content: [{ type: "text", text: summary }] };
  }
);

// ============================================================
// TOOL 3: get_criteria
// Returns the evaluation criteria (for AI context)
// ============================================================

server.tool(
  "get_ux_criteria",
  "Obtiene los criterios de evaluación UX ISO disponibles. Útil para saber qué se puede evaluar.",
  {
    standard: z.enum(["all", "9241-210", "9241-11", "25010", "25022", "25023"]).optional().describe("Filtrar por norma ISO específica"),
  },
  async ({ standard }) => {
    const filtered = standard && standard !== "all"
      ? EVALUATION_CRITERIA.filter((c) => c.standard.includes(standard))
      : EVALUATION_CRITERIA;

    const summary = filtered
      .map((c) => `[${c.id}] ${c.standard} - ${c.name} (${c.severity})\n   ${c.description}\n   Medir: ${c.howToMeasure}`)
      .join("\n\n");

    return {
      content: [{ type: "text", text: `## Criterios de Evaluación UX\n\n${filtered.length} criterios disponibles:\n\n${summary}` }],
    };
  }
);

// ============================================================
// CRITERIA DATA
// ============================================================

const EVALUATION_CRITERIA = [
  { id: "9241-210-001", standard: "ISO 9241-210", name: "Responsive Design", severity: "critical", description: "La UI debe adaptarse al dispositivo", howToMeasure: "Verificar viewport meta y media queries" },
  { id: "9241-210-002", standard: "ISO 9241-210", name: "Language Declaration", severity: "major", description: "Declarar idioma para tecnologías asistivas", howToMeasure: "Verificar html[lang]" },
  { id: "9241-210-003", standard: "ISO 9241-210", name: "Touch Targets", severity: "major", description: "Elementos interactivos ≥44x44px", howToMeasure: "Verificar tamaño de botones/links" },
  { id: "9241-210-004", standard: "ISO 9241-210", name: "Semantic Structure", severity: "major", description: "Usar HTML semántico", howToMeasure: "Verificar header/main/nav/footer" },
  { id: "9241-11-001", standard: "ISO 9241-11", name: "Task Completion Feedback", severity: "major", description: "Feedback claro al completar tareas", howToMeasure: "Verificar mensajes de éxito/error" },
  { id: "9241-11-002", standard: "ISO 9241-11", name: "Error Prevention (Labels)", severity: "major", description: "Labels en todos los inputs", howToMeasure: "Verificar label/aria-label" },
  { id: "9241-11-003", standard: "ISO 9241-11", name: "Navigation Efficiency", severity: "minor", description: "Skip-to-content link presente", howToMeasure: "Verificar skip nav link" },
  { id: "9241-11-004", standard: "ISO 9241-11", name: "Keyboard Accessibility", severity: "critical", description: "Toda función accesible por teclado", howToMeasure: "Verificar :focus styles" },
  { id: "25010-001", standard: "ISO 25010", name: "Clear Purpose (h1)", severity: "major", description: "Un único h1 comunicando propósito", howToMeasure: "Verificar presencia de h1" },
  { id: "25010-004", standard: "ISO 25010", name: "Destructive Action Confirmation", severity: "critical", description: "Confirmar antes de acciones destructivas", howToMeasure: "Verificar modales de confirmación" },
  { id: "25010-005", standard: "ISO 25010", name: "Color Contrast", severity: "critical", description: "Ratio ≥ 4.5:1 (WCAG AA)", howToMeasure: "Calcular contraste text/background" },
  { id: "25010-006", standard: "ISO 25010", name: "Image Alt Text", severity: "critical", description: "Todas las imágenes con alt", howToMeasure: "Verificar alt en img" },
  { id: "25022-001", standard: "ISO 25022", name: "Analytics Capability", severity: "suggestion", description: "Capacidad de medir uso", howToMeasure: "Verificar tracking script" },
  { id: "25022-002", standard: "ISO 25022", name: "Performance (Lazy Load)", severity: "major", description: "Carga eficiente de recursos", howToMeasure: "Verificar loading=lazy, defer" },
  { id: "25023-001", standard: "ISO 25023", name: "Component Architecture", severity: "minor", description: "UI modular y reutilizable", howToMeasure: "Verificar componentes/clases reutilizables" },
];

// ============================================================
// START SERVER
// ============================================================

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("✅ UX Evaluator MCP running on stdio");
  console.error("   Tools: evaluate_html, evaluate_css, get_ux_criteria");
  console.error("   Standards: ISO 9241-210, 9241-11, 25010, 25022, 25023");
}

main().catch((error) => {
  console.error("Fatal:", error);
  process.exit(1);
});
