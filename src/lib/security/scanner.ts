import type { SecurityLevel, SecurityReport, SecurityIssue } from "@/types";

/**
 * Security Scanner for MCP Generated Code
 * 
 * Analyzes generated code for potential security vulnerabilities
 * and ensures compliance with the selected security level.
 */
export class SecurityScanner {
  private rules: SecurityRule[] = [
    // Critical: Code execution
    {
      id: "SEC-001",
      pattern: /\beval\s*\(/g,
      severity: "critical",
      title: "Uso de eval() detectado",
      description:
        "eval() permite ejecución arbitraria de código y es un vector de inyección",
      recommendation:
        "Usar JSON.parse() para datos JSON o funciones específicas para el caso de uso",
    },
    {
      id: "SEC-002",
      pattern: /new\s+Function\s*\(/g,
      severity: "critical",
      title: "Constructor Function() detectado",
      description:
        "new Function() es equivalente a eval() y permite ejecución arbitraria",
      recommendation: "Reemplazar con funciones predefinidas o switch/case",
    },
    {
      id: "SEC-003",
      pattern: /child_process|exec\s*\(|execSync|spawn\s*\(/g,
      severity: "critical",
      title: "Ejecución de procesos del sistema",
      description:
        "Acceso a child_process permite ejecución de comandos del sistema",
      recommendation:
        "Usar APIs específicas en lugar de comandos shell. Si es necesario, usar una lista blanca de comandos",
    },

    // High: Filesystem access
    {
      id: "SEC-004",
      pattern: /fs\.(write|unlink|rm|chmod|mkdir)/g,
      severity: "high",
      title: "Escritura en filesystem detectada",
      description:
        "Operaciones de escritura pueden modificar archivos del sistema",
      recommendation:
        "Limitar a directorios específicos con validatePath() y usar permisos mínimos",
    },
    {
      id: "SEC-005",
      pattern: /\.\.\//g,
      severity: "high",
      title: "Path traversal potencial",
      description:
        "Patrones ../ pueden permitir acceso fuera del directorio permitido",
      recommendation: "Usar path.resolve() y validar que el path resuelto esté dentro del scope",
    },

    // High: Network
    {
      id: "SEC-006",
      pattern: /fetch\s*\(|axios|http\.request|https\.request/g,
      severity: "medium",
      title: "Acceso a red detectado",
      description:
        "Llamadas de red pueden exponer datos o conectar a servicios maliciosos",
      recommendation:
        "Limitar a dominios allowlisted y validar URLs antes de las peticiones",
    },

    // Medium: Information exposure
    {
      id: "SEC-007",
      pattern:
        /process\.env(?!\[['"](?:NODE_ENV|PORT|HOME)['"]|\.NODE_ENV|\.PORT)/g,
      severity: "medium",
      title: "Acceso a variables de entorno",
      description:
        "Acceso no controlado a env vars puede exponer secrets",
      recommendation:
        "Acceder solo a variables específicas y nunca exponer en outputs",
    },
    {
      id: "SEC-008",
      pattern:
        /(?:password|secret|api_key|token|private_key)\s*[:=]\s*['"][^'"]+['"]/gi,
      severity: "critical",
      title: "Secret hardcodeado detectado",
      description:
        "Credentials en código fuente son un riesgo grave de seguridad",
      recommendation:
        "Usar variables de entorno o un gestor de secrets (Vault, AWS Secrets Manager)",
    },

    // Medium: Unsafe patterns
    {
      id: "SEC-009",
      pattern: /innerHTML|outerHTML|document\.write/g,
      severity: "medium",
      title: "Manipulación DOM insegura",
      description: "innerHTML y document.write son vectores de XSS",
      recommendation: "Usar textContent o bibliotecas de sanitización como DOMPurify",
    },
    {
      id: "SEC-010",
      pattern: /JSON\.parse\s*\([^)]*\)/g,
      severity: "low",
      title: "JSON.parse sin try-catch",
      description: "JSON.parse puede lanzar excepciones con input malformado",
      recommendation: "Envolver en try-catch y validar el resultado con Zod",
    },

    // Info: Best practices
    {
      id: "SEC-011",
      pattern: /console\.(log|debug|info)/g,
      severity: "info",
      title: "Console logging en producción",
      description: "Los logs pueden exponer información sensible",
      recommendation:
        "Usar console.error para errores en MCP stdio. Remover logs de debug en producción",
    },
    {
      id: "SEC-012",
      pattern: /TODO|FIXME|HACK/g,
      severity: "info",
      title: "Marcadores de código pendiente",
      description: "Código marcado como pendiente puede contener lógica incompleta",
      recommendation:
        "Completar la implementación antes de publicar",
    },
    // Empty tool detection
    {
      id: "SEC-013",
      pattern: /\/\/\s*TODO:\s*Implement your (business |tool )?logic here/g,
      severity: "high",
      title: "Herramienta sin implementación real",
      description:
        "Se detectó un tool con lógica placeholder. El MCP no hará nada útil sin implementación real.",
      recommendation:
        "Reemplazar el TODO con lógica real de análisis/procesamiento. Usar una estrategia de acceso definida (code_input, filesystem, etc.)",
    },
    {
      id: "SEC-014",
      pattern: /return\s*\{\s*success:\s*true,\s*data:\s*\{\s*input,?\s*processedAt/g,
      severity: "high",
      title: "Tool devuelve solo echo del input",
      description:
        "La herramienta solo devuelve el input sin procesarlo. Esto indica implementación placeholder.",
      recommendation:
        "Implementar lógica real que analice, transforme, o enriquezca el input antes de devolverlo.",
    },
    {
      id: "SEC-015",
      pattern: /server\.tool\([^)]+,\s*async\s*\([^)]*\)\s*=>\s*\{\s*return\s*\{/g,
      severity: "medium",
      title: "Tool con lógica trivial (una sola línea)",
      description:
        "La herramienta tiene una implementación extremadamente simple que puede no ser útil.",
      recommendation:
        "Verificar que el tool tenga validación de input, lógica de procesamiento, y manejo de errores.",
    },
  ];

  /**
   * Scan generated code for security issues
   */
  scan(code: string, level: SecurityLevel): SecurityReport {
    const issues: SecurityIssue[] = [];

    for (const rule of this.rules) {
      // Skip low-severity rules for permissive mode
      if (
        level === "permissive" &&
        (rule.severity === "info" || rule.severity === "low")
      ) {
        continue;
      }

      const matches = code.match(rule.pattern);
      if (matches) {
        issues.push({
          id: rule.id,
          severity: rule.severity,
          title: rule.title,
          description: rule.description,
          location: this.findLocation(code, rule.pattern),
          recommendation: rule.recommendation,
        });
      }
    }

    // Calculate score
    const score = this.calculateScore(issues);

    // Determine pass threshold based on level
    const threshold =
      level === "strict" ? 90 : level === "standard" ? 70 : 50;

    return {
      score,
      level,
      issues,
      recommendations: this.generateRecommendations(issues, level),
      passed: score >= threshold && !issues.some((i) => i.severity === "critical"),
    };
  }

  /**
   * Calculate security score (0-100)
   */
  private calculateScore(issues: SecurityIssue[]): number {
    let score = 100;
    const penalties: Record<string, number> = {
      critical: 30,
      high: 15,
      medium: 8,
      low: 3,
      info: 1,
    };

    for (const issue of issues) {
      score -= penalties[issue.severity] || 0;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Find approximate location of the match in code
   */
  private findLocation(code: string, pattern: RegExp): string {
    const match = pattern.exec(code);
    if (!match) return "unknown";

    const lineNumber =
      code.substring(0, match.index).split("\n").length;
    return `Line ${lineNumber}`;
  }

  /**
   * Generate contextual recommendations
   */
  private generateRecommendations(
    issues: SecurityIssue[],
    level: SecurityLevel
  ): string[] {
    const recs: string[] = [];

    if (issues.some((i) => i.severity === "critical")) {
      recs.push(
        "⚠️ CRÍTICO: Hay vulnerabilidades críticas que deben resolverse antes de desplegar"
      );
    }

    if (level === "strict") {
      recs.push("🔒 Modo estricto: Considere agregar autenticación mutual TLS");
      recs.push("🔒 Modo estricto: Implementar Content Security Policy headers");
    }

    if (issues.some((i) => i.id === "SEC-006")) {
      recs.push(
        "🌐 Network: Implementar allowlist de dominios permitidos para llamadas externas"
      );
    }

    if (issues.some((i) => i.id === "SEC-004")) {
      recs.push(
        "📁 Filesystem: Implementar chroot o restricción de paths con validatePath()"
      );
    }

    if (recs.length === 0) {
      recs.push("✅ El código generado cumple con los estándares de seguridad");
    }

    return recs;
  }
}

interface SecurityRule {
  id: string;
  pattern: RegExp;
  severity: "critical" | "high" | "medium" | "low" | "info";
  title: string;
  description: string;
  recommendation: string;
}
