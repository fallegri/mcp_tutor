/**
 * Resource Generator Module
 * 
 * Auto-generates MCP Resources (server.resource()) based on:
 * 1. Context analysis (detected domain knowledge needs)
 * 2. User-uploaded material (converted to Resources)
 * 3. Access strategy requirements
 * 
 * Resources give the AI CLIENT context about what the MCP does,
 * what criteria it uses, and what data formats it expects.
 * This is the KEY to preventing "empty context" MCPs.
 */

import type { McpProjectConfig, AccessStrategy } from "@/types";
import type { ContextAnalysis, SuggestedResource } from "./context-analyzer";

// ============================================================
// TYPES
// ============================================================

export interface GeneratedResource {
  /** Resource name (URI-safe identifier) */
  name: string;
  /** Human-readable description */
  description: string;
  /** MIME type of the resource content */
  mimeType: string;
  /** The actual content to serve */
  content: string;
  /** Whether this is static or dynamically generated */
  isStatic: boolean;
  /** Code to register this resource in the MCP server */
  registrationCode: string;
}

// ============================================================
// MAIN GENERATOR
// ============================================================

/**
 * Generate all MCP Resources for a project
 */
export function generateResources(config: McpProjectConfig): GeneratedResource[] {
  const resources: GeneratedResource[] = [];

  // 1. Generate resources from context analysis
  if (config.contextAnalysis?.suggestedResources) {
    for (const suggested of config.contextAnalysis.suggestedResources) {
      resources.push(fromSuggestedResource(suggested as unknown as SuggestedResource, config));
    }
  }

  // 2. Generate resources from user-uploaded material
  if (config.additionalMaterial && config.additionalMaterial.length > 0) {
    for (const material of config.additionalMaterial) {
      resources.push(fromUserMaterial(material, config));
    }
  }

  // 3. Generate strategy-specific resources
  const strategyResource = generateStrategyResource(config);
  if (strategyResource) {
    resources.push(strategyResource);
  }

  // 4. Always add a server info resource
  resources.push(generateServerInfoResource(config));

  return resources;
}

/**
 * Generate the code file that registers all resources
 */
export function generateResourcesFile(resources: GeneratedResource[]): string {
  if (resources.length === 0) return "";

  const imports = `import { z } from "zod";\nimport type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";\n`;

  const registrations = resources
    .map((r) => r.registrationCode)
    .join("\n\n");

  return `${imports}
/**
 * MCP Resources Registration
 * 
 * Resources provide context to the AI client about what this server
 * does, what criteria it uses, and what data formats it expects.
 * The AI reads these to understand HOW to use the tools effectively.
 */
export function registerResources(server: McpServer): void {
${registrations}
}
`;
}

// ============================================================
// RESOURCE GENERATORS
// ============================================================

function fromSuggestedResource(
  suggested: SuggestedResource,
  config: McpProjectConfig
): GeneratedResource {
  const slug = suggested.name.toLowerCase().replace(/\s+/g, "-");
  const uri = `${slug}://${config.name.toLowerCase().replace(/\s+/g, "-")}`;
  const mimeType = suggested.type === "criteria" ? "application/json" : "text/plain";

  const registrationCode = `  // Resource: ${suggested.name}
  // ${suggested.description}
  server.resource(
    "${slug}",
    "${uri}",
    async () => ({
      contents: [
        {
          uri: "${uri}",
          text: ${JSON.stringify(suggested.contentTemplate)},
          mimeType: "${mimeType}",
        },
      ],
    })
  );`;

  return {
    name: slug,
    description: suggested.description,
    mimeType,
    content: suggested.contentTemplate,
    isStatic: true,
    registrationCode,
  };
}

function fromUserMaterial(
  material: { name: string; type: string; content: string },
  config: McpProjectConfig
): GeneratedResource {
  const slug = material.name
    .toLowerCase()
    .replace(/\.[^.]+$/, "") // remove extension
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-");
  const uri = `user-material://${slug}`;

  const mimeType =
    material.type === "code"
      ? "text/plain"
      : material.type === "specification"
        ? "application/json"
        : "text/markdown";

  // Escape the content for embedding in code
  const escapedContent = material.content
    .replace(/\\/g, "\\\\")
    .replace(/`/g, "\\`")
    .replace(/\$/g, "\\$");

  const registrationCode = `  // Resource: ${material.name} (user-provided ${material.type})
  server.resource(
    "${slug}",
    "${uri}",
    async () => ({
      contents: [
        {
          uri: "${uri}",
          text: \`${escapedContent}\`,
          mimeType: "${mimeType}",
        },
      ],
    })
  );`;

  return {
    name: slug,
    description: `User-provided ${material.type}: ${material.name}`,
    mimeType,
    content: material.content,
    isStatic: true,
    registrationCode,
  };
}

function generateStrategyResource(
  config: McpProjectConfig
): GeneratedResource | null {
  const strategy = config.accessStrategy || "code_input";

  // Only generate for strategies that need usage instructions
  const instructions = getStrategyInstructions(strategy, config);
  if (!instructions) return null;

  const slug = "usage-instructions";
  const uri = `instructions://${slug}`;

  const registrationCode = `  // Resource: Usage instructions for the AI
  // Tells the AI HOW to provide data to this MCP's tools
  server.resource(
    "${slug}",
    "${uri}",
    async () => ({
      contents: [
        {
          uri: "${uri}",
          text: ${JSON.stringify(instructions)},
          mimeType: "text/markdown",
        },
      ],
    })
  );`;

  return {
    name: slug,
    description: "Instructions for AI on how to use this MCP correctly",
    mimeType: "text/markdown",
    content: instructions,
    isStatic: true,
    registrationCode,
  };
}

function generateServerInfoResource(config: McpProjectConfig): GeneratedResource {
  const slug = "server-info";
  const uri = `info://${slug}`;

  const info = {
    name: config.name,
    description: config.objective,
    accessStrategy: config.accessStrategy || "code_input",
    securityLevel: config.securityLevel,
    tools: config.skills.map((s) => s.name),
    usage: getUsageGuidelines(config),
  };

  const content = JSON.stringify(info, null, 2);

  const registrationCode = `  // Resource: Server information and capabilities
  server.resource(
    "${slug}",
    "${uri}",
    async () => ({
      contents: [
        {
          uri: "${uri}",
          text: JSON.stringify(${JSON.stringify(info)}, null, 2),
          mimeType: "application/json",
        },
      ],
    })
  );`;

  return {
    name: slug,
    description: "Server metadata, capabilities, and usage guidelines",
    mimeType: "application/json",
    content,
    isStatic: true,
    registrationCode,
  };
}

// ============================================================
// STRATEGY INSTRUCTIONS
// ============================================================

function getStrategyInstructions(
  strategy: AccessStrategy,
  config: McpProjectConfig
): string | null {
  switch (strategy) {
    case "code_input":
      return `# Instrucciones de Uso - ${config.name}

## Cómo proporcionar datos a este MCP

Este servidor MCP analiza **código fuente** que tú (el AI) le envías directamente.

### Flujo correcto:
1. El usuario te pide evaluar/analizar un archivo o fragmento de código
2. TÚ lees el archivo (del filesystem o del contexto del usuario)
3. Envías el contenido como parámetro al tool correspondiente
4. El MCP analiza y devuelve resultados

### ⚠️ NO hacer:
- No enviar URLs esperando que el MCP las abra (no puede)
- No enviar paths de archivo esperando que el MCP los lea
- Siempre enviar el CONTENIDO del archivo, no su ubicación

### Ejemplo:
\`\`\`
// CORRECTO: Leer el archivo y pasar su contenido
const htmlContent = readFile("index.html");
callTool("evaluate_html", { html: htmlContent });

// INCORRECTO: Pasar solo la ruta
callTool("evaluate_html", { html: "index.html" }); // ❌ El MCP no puede leer archivos
\`\`\`

### Tools disponibles:
${config.skills.map((s) => `- **${s.name}**: Recibe código/texto como input`).join("\n")}
`;

    case "filesystem":
      return `# Instrucciones de Uso - ${config.name}

## Acceso a Filesystem

Este MCP lee archivos directamente del disco. Los paths deben estar dentro de los directorios permitidos.

### Directorios permitidos:
- Solo los configurados al iniciar el servidor
- Se valida que no haya path traversal (../)

### Tools disponibles:
${config.skills.map((s) => `- **${s.name}**`).join("\n")}
`;

    case "database":
      return `# Instrucciones de Uso - ${config.name}

## Acceso a Base de Datos

Este MCP ejecuta consultas contra una base de datos configurada.

### Restricciones:
- Solo consultas SELECT (read-only)
- Queries parametrizadas (anti SQL injection)
- Timeout de 10 segundos por query
- Máximo 1000 filas por resultado

### Tools disponibles:
${config.skills.map((s) => `- **${s.name}**`).join("\n")}
`;

    case "url_fetch":
      return `# Instrucciones de Uso - ${config.name}

## Acceso HTTP

Este MCP obtiene contenido de URLs vía fetch.

### Restricciones:
- Solo dominios en la allowlist
- Timeout de 10 segundos
- Solo respuestas de texto (no binario)
- Content-length máximo: 1MB

### ⚠️ Nota importante:
Fetch obtiene HTML sin ejecutar JavaScript. Para SPAs (React, Vue, Angular), 
el HTML puede estar vacío. Si necesitas el DOM renderizado, considera usar la
estrategia "browser" en su lugar.

### Tools disponibles:
${config.skills.map((s) => `- **${s.name}**`).join("\n")}
`;

    case "browser":
      return `# Instrucciones de Uso - ${config.name}

## Navegador Headless

Este MCP usa Puppeteer para renderizar páginas completas.

### Capacidades:
- Renderiza JavaScript (SPAs, React, Vue, etc.)
- Puede tomar screenshots
- Puede extraer DOM renderizado
- Puede interactuar con elementos

### Restricciones:
- Timeout de 30 segundos por página
- Solo URLs allowlisted
- No descarga archivos
- No accede a localhost por defecto

### Tools disponibles:
${config.skills.map((s) => `- **${s.name}**`).join("\n")}
`;

    default:
      return null;
  }
}

function getUsageGuidelines(config: McpProjectConfig): string {
  const strategy = config.accessStrategy || "code_input";

  switch (strategy) {
    case "code_input":
      return "Pass source code content directly to tools as string parameters. Read files first, then send content.";
    case "filesystem":
      return "Provide file paths relative to the allowed root directory.";
    case "url_fetch":
      return "Provide full URLs. Only allowlisted domains are accessible.";
    case "database":
      return "Send SQL queries as strings. Only SELECT statements allowed.";
    case "api_call":
      return "Provide API endpoints and parameters. Authentication is pre-configured.";
    case "browser":
      return "Provide URLs to render. The browser will execute JavaScript and return the DOM.";
    default:
      return "Follow the usage instructions resource for details.";
  }
}
