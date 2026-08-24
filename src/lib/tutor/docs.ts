import type {
  McpProjectConfig,
  TutorDocumentation,
  TutorStep,
  GlossaryEntry,
  MermaidDiagram,
} from "@/types";
import { diagramGenerator } from "./diagrams";

/**
 * Tutor Documentation Generator
 * 
 * Generates comprehensive, beginner-friendly documentation
 * with Mermaid diagrams compatible with Google Docs and Word.
 * 
 * The documentation explains:
 * - What the MCP does (in plain language)
 * - How each part works
 * - Step-by-step construction process
 * - Security measures in place
 */
export class TutorDocGenerator {
  /**
   * Generate complete tutor documentation
   */
  generate(config: McpProjectConfig): TutorDocumentation {
    const diagrams = diagramGenerator.generateAll(config);
    const steps = this.generateSteps(config);
    const glossary = this.generateGlossary();

    return {
      title: `Guía Tutorial: ${config.name}`,
      overview: this.generateOverview(config),
      mermaidDiagrams: diagrams,
      steps,
      glossary,
      exportFormats: [
        {
          name: "Markdown",
          format: "md",
          content: this.exportToMarkdown(config, diagrams, steps, glossary),
        },
      ],
    };
  }

  /**
   * Generate overview explanation
   */
  private generateOverview(config: McpProjectConfig): string {
    return `## ¿Qué es "${config.name}"?

**${config.name}** es un servidor MCP (Model Context Protocol) que actúa como un "puente" entre 
herramientas de inteligencia artificial y las funcionalidades que necesitas.

### Analogía Simple 🎯
Imagina que tienes un asistente de IA (como Claude o Codex). Este asistente es muy inteligente 
pero no puede acceder a tus herramientas específicas. El servidor MCP es como un "adaptador universal" 
que permite al asistente usar herramientas personalizadas que tú defines.

### ¿Para qué sirve?
${config.objective}

### Plataformas compatibles
${config.targetPlatforms.map((p) => `- ${this.getPlatformDisplayName(p)}`).join("\n")}

### Nivel de Seguridad: ${config.securityLevel === "strict" ? "🔒 Estricto" : config.securityLevel === "standard" ? "🛡️ Estándar" : "⚡ Permisivo"}
${this.getSecurityExplanation(config.securityLevel)}
`;
  }

  /**
   * Generate step-by-step tutorial
   */
  private generateSteps(config: McpProjectConfig): TutorStep[] {
    const steps: TutorStep[] = [];

    // Step 1: Understanding the concept
    steps.push({
      number: 1,
      title: "Entendiendo el Concepto MCP",
      explanation: `MCP (Model Context Protocol) es un estándar abierto creado para conectar 
modelos de IA con herramientas externas. Funciona usando JSON-RPC 2.0 como protocolo de comunicación.`,
      nonTechnicalExplanation: `Piensa en MCP como un "idioma universal" que permite a diferentes 
asistentes de IA (Claude, Codex, etc.) hablar con tus herramientas personalizadas. 
Es como un traductor simultáneo entre dos personas que hablan diferente idioma.`,
      tips: [
        "MCP es un estándar abierto - cualquier herramienta puede implementarlo",
        "No necesitas ser programador para entender cómo funciona conceptualmente",
        "Es similar a cómo un USB permite conectar diferentes dispositivos a tu computadora",
      ],
    });

    // Step 2: Project structure
    steps.push({
      number: 2,
      title: "Estructura del Proyecto",
      explanation: `El proyecto se organiza en carpetas con responsabilidades claras:
- \`src/index.ts\`: Punto de entrada (donde arranca el servidor)
- \`src/tools/\`: Las herramientas que el AI puede usar
- \`src/security.ts\`: Protecciones contra uso malicioso
- \`package.json\`: Lista de ingredientes (dependencias)`,
      codeExample: `// Estructura de archivos
📁 ${config.name.toLowerCase().replace(/\s+/g, "-")}/
├── 📄 package.json        → Dependencias del proyecto
├── 📄 tsconfig.json       → Configuración TypeScript
├── 📁 src/
│   ├── 📄 index.ts        → Arranca el servidor
│   ├── 📄 security.ts     → Validaciones de seguridad
│   ├── 📄 types.ts        → Definiciones de datos
│   └── 📁 tools/          → Herramientas del MCP
${config.skills.map((s) => `│       └── 📄 ${s.name.toLowerCase().replace(/\s+/g, "-")}.ts`).join("\n")}
└── 📄 README.md           → Documentación`,
      nonTechnicalExplanation: `Imagina que estás construyendo una casa. El proyecto tiene diferentes 
"habitaciones" (carpetas) donde cada una tiene un propósito. La carpeta "tools" es como la cocina 
donde se preparan las cosas, "security" es como el sistema de alarma, y "index.ts" es la puerta 
principal por donde se entra.`,
      tips: [
        "Cada archivo tiene UNA responsabilidad clara",
        "Los nombres de archivos describen lo que hacen",
        "La seguridad se maneja en un solo lugar centralizado",
      ],
    });

    // Step 3: The server
    steps.push({
      number: 3,
      title: "El Servidor MCP",
      explanation: `El servidor es el componente central que:
1. Se identifica ante los clientes AI (nombre y versión)
2. Declara qué herramientas tiene disponibles
3. Recibe peticiones y las enruta a la herramienta correcta
4. Devuelve resultados en formato estándar`,
      codeExample: `// Ejemplo simplificado del servidor
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const server = new McpServer({
  name: "${config.name.toLowerCase().replace(/\s+/g, "-")}",
  version: "1.0.0",
  capabilities: { tools: {} },
});

// Registrar herramientas...
// Conectar transporte...`,
      nonTechnicalExplanation: `El servidor es como un recepcionista en un hotel. Cuando un huésped 
(el AI) llega y pide algo, el recepcionista sabe exactamente a quién llamar (qué herramienta usar) 
y cómo entregarle la respuesta. El recepcionista también verifica la identidad del huésped y 
se asegura de que las peticiones sean legítimas.`,
      tips: [
        'El servidor solo "escucha" y responde - no inicia acciones por sí solo',
        "Cada herramienta se registra con un nombre y descripción",
        "El servidor valida TODAS las peticiones antes de procesarlas",
      ],
    });

    // Step 4: Tools
    steps.push({
      number: 4,
      title: "Las Herramientas (Tools)",
      explanation: `Cada herramienta es una función que el AI puede invocar. Define:
- **Nombre**: Identificador único
- **Descripción**: Qué hace (el AI lee esto para decidir cuándo usarla)
- **Schema de entrada**: Qué datos necesita recibir
- **Lógica**: Qué hace con esos datos
- **Respuesta**: Qué devuelve`,
      codeExample: `// Ejemplo de una herramienta
server.tool(
  "mi_herramienta",          // Nombre
  "Hace algo específico",    // Descripción para el AI
  { query: z.string() },     // Qué necesita recibir
  async ({ query }) => {     // Qué hace
    const result = await procesar(query);
    return {
      content: [{ type: "text", text: result }]
    };
  }
);`,
      nonTechnicalExplanation: `Las herramientas son como los "poderes especiales" que le das al 
asistente AI. Sin herramientas, el AI solo puede hablar. Con herramientas, puede HACER cosas: 
buscar información, procesar datos, conectar con servicios, etc. Cada herramienta es como 
darle una habilidad nueva al asistente.`,
      tips: [
        "Cada herramienta debe hacer UNA cosa bien",
        "La descripción es crucial - el AI la usa para decidir cuándo usarla",
        "Siempre validar los datos de entrada antes de procesarlos",
      ],
    });

    // Step 5: Security
    steps.push({
      number: 5,
      title: "Seguridad del MCP",
      explanation: `La seguridad es fundamental porque el AI podría recibir instrucciones 
maliciosas (prompt injection). El módulo de seguridad protege contra:
- Inyección de código
- Acceso no autorizado al filesystem
- Ataques de denegación de servicio
- Exposición de información sensible`,
      nonTechnicalExplanation: `Imagina que tu herramienta es como una caja fuerte con ventanilla. 
La seguridad es el guardia que:
- Verifica que quien pide algo tiene permiso (autenticación)
- Revisa que lo que piden es razonable (validación)
- Limita cuántas veces pueden pedir algo (rate limiting)
- No muestra información confidencial (sanitización)
Es como el sistema de seguridad de un banco: protege tanto a ti como a los usuarios.`,
      tips: [
        "NUNCA confiar en los datos que llegan del exterior",
        "Limitar el tamaño de las entradas para prevenir ataques",
        "Ocultar mensajes de error detallados en producción",
        "Registrar intentos sospechosos para auditoría",
      ],
    });

    // Step 6: Configuration per platform
    steps.push({
      number: 6,
      title: "Configuración por Plataforma",
      explanation: `Cada plataforma AI tiene su propia forma de configurar servidores MCP.
El proyecto genera archivos de configuración específicos para cada plataforma target.`,
      codeExample: config.targetPlatforms
        .map((p) => {
          if (p === "claude_code")
            return `// Claude Code: claude mcp add-json
{"command":"node","args":["./dist/index.js"]}`;
          if (p === "openai_codex")
            return `// OpenAI Codex: codex.json
{"mcpServers":{"${config.name.toLowerCase()}":{"command":"node","args":["./dist/index.js"]}}}`;
          return `// ${p}: Configuración estándar`;
        })
        .join("\n\n"),
      nonTechnicalExplanation: `Es como cuando tienes un cargador universal para el teléfono: 
el cargador (tu MCP) es el mismo, pero necesitas un adaptador diferente según el enchufe 
(plataforma AI) donde lo conectes. Cada plataforma tiene su "enchufe" particular pero 
la energía (funcionalidad) es la misma.`,
      tips: [
        "Siempre probar la conexión después de configurar",
        "Guardar las configuraciones en control de versiones",
        "Documentar qué plataformas están soportadas",
      ],
    });

    // Step 7: Deployment
    steps.push({
      number: 7,
      title: "Despliegue y Uso",
      explanation: `El MCP puede ejecutarse de dos formas:
1. **Local (stdio)**: Se ejecuta en tu máquina, comunicación directa
2. **Remoto (HTTP)**: Se despliega en la nube (Vercel), accesible desde cualquier lugar`,
      codeExample: `# Local
npm run build
npm start

# Vercel (cloud)
vercel deploy`,
      nonTechnicalExplanation: `Es como la diferencia entre cocinar en casa (local) vs pedir 
delivery (remoto). Cocinar en casa es más rápido pero solo tú puedes comer. El delivery 
puede llegar a cualquier dirección pero tarda un poco más. Para uso personal, local es 
perfecto. Para compartir con equipo, la nube es mejor.`,
      tips: [
        "Empezar siempre con modo local para desarrollo",
        "La nube es mejor para equipos y acceso remoto",
        "Siempre tener variables de entorno seguras",
        "Monitorear los logs en producción",
      ],
    });

    return steps;
  }

  /**
   * Generate glossary of terms
   */
  private generateGlossary(): GlossaryEntry[] {
    return [
      {
        term: "MCP (Model Context Protocol)",
        definition:
          "Protocolo abierto que estandariza cómo las aplicaciones AI se conectan con herramientas externas",
        example: "Claude Code usando MCP para conectarse a GitHub",
      },
      {
        term: "JSON-RPC",
        definition:
          "Protocolo de comunicación donde se envían peticiones y respuestas en formato JSON",
        example: '{"method": "tools/call", "params": {"name": "mi_tool"}}',
      },
      {
        term: "Tool (Herramienta)",
        definition:
          "Una función que el servidor MCP expone para que el AI pueda invocar",
        example:
          "Una herramienta que busca en una base de datos o procesa un archivo",
      },
      {
        term: "Transport (Transporte)",
        definition:
          "El medio de comunicación entre cliente y servidor: stdio (local) o HTTP (remoto)",
        example:
          "stdio usa la entrada/salida estándar del terminal; HTTP usa la red",
      },
      {
        term: "Schema",
        definition:
          "La definición formal de qué datos acepta y devuelve una herramienta",
        example:
          "Un schema que dice: necesito un string 'query' de máximo 1000 caracteres",
      },
      {
        term: "Rate Limiting",
        definition:
          "Límite de cuántas peticiones se pueden hacer por minuto para prevenir abuso",
        example: "Máximo 50 peticiones por minuto por usuario",
      },
      {
        term: "Sanitización",
        definition:
          "Proceso de limpiar datos de entrada para eliminar contenido potencialmente dañino",
        example:
          "Remover tags HTML o código JavaScript de un texto de entrada",
      },
      {
        term: "Zod",
        definition:
          "Biblioteca TypeScript para validar datos con tipos seguros en tiempo de ejecución",
        example:
          "z.string().min(1).max(1000) valida que sea texto de 1 a 1000 caracteres",
      },
      {
        term: "Vercel",
        definition:
          "Plataforma de despliegue en la nube optimizada para aplicaciones JavaScript/TypeScript",
        example:
          "Subir tu servidor MCP a Vercel para que sea accesible desde internet",
      },
      {
        term: "Neon",
        definition:
          "Base de datos PostgreSQL serverless en la nube, perfecta para aplicaciones modernas",
        example:
          "Almacenar configuraciones y historial de MCPs en Neon PostgreSQL",
      },
    ];
  }

  /**
   * Export everything to Markdown format (compatible with Google Docs/Word)
   */
  private exportToMarkdown(
    config: McpProjectConfig,
    diagrams: MermaidDiagram[],
    steps: TutorStep[],
    glossary: GlossaryEntry[]
  ): string {
    let md = `# 📖 Guía Tutorial: ${config.name}

> **Modo**: Tutorial paso a paso
> **Fecha de generación**: ${new Date().toLocaleDateString("es-ES")}
> **Nivel de seguridad**: ${config.securityLevel}
> **Objetivo**: ${config.objective}

---

## 📋 Tabla de Contenidos

1. [Visión General](#visión-general)
2. [Diagramas de Arquitectura](#diagramas-de-arquitectura)
3. [Guía Paso a Paso](#guía-paso-a-paso)
4. [Glosario de Términos](#glosario-de-términos)

---

## 🎯 Visión General

${this.generateOverview(config)}

---

## 📊 Diagramas de Arquitectura

> **Nota**: Los diagramas usan formato Mermaid. Para verlos en Google Docs o Word,
> puedes copiar el código en [mermaid.live](https://mermaid.live) y pegar la imagen generada.

`;

    // Add diagrams
    for (const diagram of diagrams) {
      md += `### ${diagram.title}

*${diagram.description}*

\`\`\`mermaid
${diagram.code}
\`\`\`

---

`;
    }

    // Add steps
    md += `## 📝 Guía Paso a Paso

`;

    for (const step of steps) {
      md += `### Paso ${step.number}: ${step.title}

#### Explicación Técnica
${step.explanation}

#### 💡 Explicación Simple (No Técnica)
${step.nonTechnicalExplanation}

`;

      if (step.codeExample) {
        md += `#### 💻 Ejemplo de Código
\`\`\`typescript
${step.codeExample}
\`\`\`

`;
      }

      md += `#### 📌 Consejos
${step.tips.map((t) => `- ${t}`).join("\n")}

---

`;
    }

    // Add glossary
    md += `## 📚 Glosario de Términos

| Término | Definición | Ejemplo |
|---------|-----------|---------|
${glossary.map((g) => `| **${g.term}** | ${g.definition} | ${g.example || "-"} |`).join("\n")}

---

## 🔗 Recursos Adicionales

- [Especificación MCP Oficial](https://modelcontextprotocol.io/specification/2025-06-18)
- [TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [Ejemplos de Servidores MCP](https://github.com/modelcontextprotocol/servers)

---

*Documento generado por MCP Builder - Modo Tutor*
`;

    return md;
  }

  /**
   * Helper methods
   */
  private getPlatformDisplayName(platform: string): string {
    const names: Record<string, string> = {
      claude_code: "Claude Code (Anthropic)",
      openai_codex: "OpenAI Codex",
      opencode: "OpenCode",
      antigravity: "Antigravity",
      cursor: "Cursor",
      kiro: "Kiro",
      universal: "Universal",
    };
    return names[platform] || platform;
  }

  private getSecurityExplanation(level: string): string {
    switch (level) {
      case "strict":
        return `El nivel **Estricto** aplica las máximas protecciones: validación exhaustiva de 
inputs, sin acceso al filesystem, sin acceso a red, límite de 500 caracteres por input, y máximo 
10 peticiones por minuto. Ideal para entornos de producción sensibles.`;
      case "standard":
        return `El nivel **Estándar** balancea seguridad y funcionalidad: validación de inputs, 
acceso limitado al filesystem (solo lectura en paths permitidos), red restringida a dominios 
allowlisted, límite de 2000 caracteres, y 50 peticiones por minuto.`;
      default:
        return `El nivel **Permisivo** ofrece protecciones básicas manteniendo máxima flexibilidad: 
validación básica de inputs, acceso al filesystem dentro del proyecto, red abierta, límite de 
5000 caracteres, y 100 peticiones por minuto. Solo para desarrollo local.`;
    }
  }
}

export const tutorDocGenerator = new TutorDocGenerator();
