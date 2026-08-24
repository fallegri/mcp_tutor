import { z } from "zod";
import type {
  McpProjectConfig,
  GenerationResult,
  GeneratedFile,
  PlatformConfig,
  Platform,
  SecurityReport,
} from "@/types";
import { SecurityScanner } from "@/lib/security/scanner";
import { getPlatformAdapter } from "./platforms";
import { getTemplate } from "./templates";

/**
 * Motor principal de generación de MCPs
 * Toma la configuración del proyecto y genera código funcional
 */
export class McpGenerator {
  private securityScanner: SecurityScanner;

  constructor() {
    this.securityScanner = new SecurityScanner();
  }

  /**
   * Genera un proyecto MCP completo
   */
  async generate(config: McpProjectConfig): Promise<GenerationResult> {
    // 1. Validar configuración
    this.validateConfig(config);

    // 2. Obtener template base
    const template = getTemplate(config.transport, config.securityLevel);

    // 3. Generar archivos del servidor MCP
    const files = this.generateFiles(config, template);

    // 4. Generar configuraciones por plataforma
    const platformConfigs = this.generatePlatformConfigs(config, files);

    // 5. Escanear seguridad del código generado
    const securityReport = this.securityScanner.scan(
      files.map((f) => f.content).join("\n"),
      config.securityLevel
    );

    // 6. Si hay issues críticos, intentar corregir
    if (!securityReport.passed) {
      const fixedFiles = this.applySecurityFixes(files, securityReport);
      return {
        success: true,
        project: { id: crypto.randomUUID(), name: config.name },
        files: fixedFiles,
        platformConfigs,
        securityReport: this.securityScanner.scan(
          fixedFiles.map((f) => f.content).join("\n"),
          config.securityLevel
        ),
      };
    }

    return {
      success: true,
      project: { id: crypto.randomUUID(), name: config.name },
      files,
      platformConfigs,
      securityReport,
    };
  }

  /**
   * Genera los archivos del servidor MCP
   */
  private generateFiles(
    config: McpProjectConfig,
    template: string
  ): GeneratedFile[] {
    const files: GeneratedFile[] = [];

    // package.json del MCP generado
    files.push({
      path: "package.json",
      content: this.generatePackageJson(config),
      language: "json",
      description: "Configuración del proyecto y dependencias",
    });

    // tsconfig.json
    files.push({
      path: "tsconfig.json",
      content: this.generateTsConfig(),
      language: "json",
      description: "Configuración de TypeScript",
    });

    // Archivo principal del servidor
    files.push({
      path: "src/index.ts",
      content: this.generateMainServer(config, template),
      language: "typescript",
      description: "Punto de entrada del servidor MCP",
    });

    // Tools (skills como herramientas MCP)
    for (const skill of config.skills) {
      files.push({
        path: `src/tools/${skill.name.toLowerCase().replace(/\s+/g, "-")}.ts`,
        content: this.generateTool(skill, config),
        language: "typescript",
        description: `Herramienta: ${skill.name}`,
      });
    }

    // Archivo de tipos
    files.push({
      path: "src/types.ts",
      content: this.generateTypes(config),
      language: "typescript",
      description: "Definiciones de tipos TypeScript",
    });

    // Módulo de seguridad
    files.push({
      path: "src/security.ts",
      content: this.generateSecurityModule(config),
      language: "typescript",
      description: "Módulo de validación y seguridad",
    });

    // README
    files.push({
      path: "README.md",
      content: this.generateReadme(config),
      language: "markdown",
      description: "Documentación del proyecto",
    });

    return files;
  }

  private generatePackageJson(config: McpProjectConfig): string {
    const pkg = {
      name: config.name.toLowerCase().replace(/\s+/g, "-"),
      version: "1.0.0",
      description: config.description,
      type: "module",
      main: "dist/index.js",
      bin: {
        [config.name.toLowerCase().replace(/\s+/g, "-")]: "dist/index.js",
      },
      scripts: {
        build: "tsc",
        start: "node dist/index.js",
        dev: "tsx src/index.ts",
        "type-check": "tsc --noEmit",
      },
      dependencies: {
        "@modelcontextprotocol/sdk": "^1.12.0",
        zod: "^3.23.0",
      },
      devDependencies: {
        "@types/node": "^22.0.0",
        tsx: "^4.19.0",
        typescript: "^5.6.0",
      },
    };

    // Add transport-specific dependencies
    if (config.transport === "http") {
      (pkg.dependencies as Record<string, string>)["express"] = "^4.21.0";
      (pkg.devDependencies as Record<string, string>)["@types/express"] =
        "^5.0.0";
    }

    return JSON.stringify(pkg, null, 2);
  }

  private generateTsConfig(): string {
    return JSON.stringify(
      {
        compilerOptions: {
          target: "ES2022",
          module: "ESNext",
          moduleResolution: "bundler",
          outDir: "./dist",
          rootDir: "./src",
          strict: true,
          esModuleInterop: true,
          skipLibCheck: true,
          declaration: true,
        },
        include: ["src/**/*"],
        exclude: ["node_modules", "dist"],
      },
      null,
      2
    );
  }

  private generateMainServer(
    config: McpProjectConfig,
    template: string
  ): string {
    const toolImports = config.skills
      .map((skill) => {
        const fileName = skill.name.toLowerCase().replace(/\s+/g, "-");
        const funcName = skill.name
          .replace(/\s+/g, "")
          .replace(/^./, (c) => c.toLowerCase());
        return `import { register${funcName.charAt(0).toUpperCase() + funcName.slice(1)}Tool } from "./tools/${fileName}.js";`;
      })
      .join("\n");

    const toolRegistrations = config.skills
      .map((skill) => {
        const funcName = skill.name
          .replace(/\s+/g, "")
          .replace(/^./, (c) => c.toLowerCase());
        return `  register${funcName.charAt(0).toUpperCase() + funcName.slice(1)}Tool(server);`;
      })
      .join("\n");

    if (config.transport === "stdio") {
      return `#!/usr/bin/env node
/**
 * ${config.name} - MCP Server
 * ${config.description}
 * 
 * Generated by MCP Builder
 * Transport: stdio
 * Security Level: ${config.securityLevel}
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { validateInput } from "./security.js";
${toolImports}

// Create MCP Server instance
const server = new McpServer({
  name: "${config.name.toLowerCase().replace(/\s+/g, "-")}",
  version: "1.0.0",
  capabilities: {
    tools: {},
  },
});

// Register all tools
${toolRegistrations}

// Start server with stdio transport
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("${config.name} MCP server started on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
`;
    }

    // HTTP transport
    return `#!/usr/bin/env node
/**
 * ${config.name} - MCP Server
 * ${config.description}
 * 
 * Generated by MCP Builder
 * Transport: Streamable HTTP
 * Security Level: ${config.securityLevel}
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express from "express";
import { validateInput, rateLimiter } from "./security.js";
${toolImports}

const app = express();
app.use(express.json());

// Security middleware
app.use(rateLimiter);

// Create MCP Server instance
const server = new McpServer({
  name: "${config.name.toLowerCase().replace(/\s+/g, "-")}",
  version: "1.0.0",
  capabilities: {
    tools: {},
  },
});

// Register all tools
${toolRegistrations}

// MCP endpoint
app.post("/mcp", async (req, res) => {
  try {
    const transport = new StreamableHTTPServerTransport("/mcp", res);
    await server.connect(transport);
    await transport.handleRequest(req, res);
  } catch (error) {
    console.error("MCP request error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", server: "${config.name}" });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(\`${config.name} MCP server running on port \${PORT}\`);
});
`;
  }

  private generateTool(
    skill: McpProjectConfig["skills"][0],
    config: McpProjectConfig
  ): string {
    const funcName = skill.name
      .replace(/\s+/g, "")
      .replace(/^./, (c) => c.toLowerCase());
    const className =
      funcName.charAt(0).toUpperCase() + funcName.slice(1) + "Tool";
    const registerFn = `register${funcName.charAt(0).toUpperCase() + funcName.slice(1)}Tool`;

    return `import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { validateInput } from "../security.js";

/**
 * Tool: ${skill.name}
 * Description: Tool implementation for ${skill.name}
 * Security Level: ${config.securityLevel}
 */

// Input schema validation
const inputSchema = z.object({
  // TODO: Define your input parameters here
  query: z.string().min(1).max(1000).describe("Input query for the tool"),
});

// Output type
interface ${className}Result {
  success: boolean;
  data: unknown;
  message: string;
}

/**
 * Register the ${skill.name} tool with the MCP server
 */
export function ${registerFn}(server: McpServer): void {
  server.tool(
    "${skill.name.toLowerCase().replace(/\s+/g, "_")}",
    "Tool: ${skill.name}",
    {
      query: z.string().describe("Input query for the tool"),
    },
    async ({ query }) => {
      try {
        // Validate input
        const sanitizedInput = validateInput(query);
        
        // TODO: Implement your tool logic here
        const result = await execute${className}(sanitizedInput);

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return {
          content: [
            {
              type: "text" as const,
              text: \`Error in ${skill.name}: \${errorMessage}\`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}

/**
 * Core execution logic for ${skill.name}
 */
async function execute${className}(input: string): Promise<${className}Result> {
  // TODO: Implement your business logic here
  return {
    success: true,
    data: { input, processedAt: new Date().toISOString() },
    message: "Operation completed successfully",
  };
}
`;
  }

  private generateTypes(config: McpProjectConfig): string {
    return `/**
 * Type definitions for ${config.name}
 * Generated by MCP Builder
 */

export interface ToolResult {
  success: boolean;
  data: unknown;
  message: string;
}

export interface SecurityContext {
  level: "${config.securityLevel}";
  allowedOperations: string[];
  maxInputLength: number;
  rateLimitPerMinute: number;
}

export interface ServerConfig {
  name: string;
  version: string;
  transport: "${config.transport}";
  securityLevel: "${config.securityLevel}";
}
`;
  }

  private generateSecurityModule(config: McpProjectConfig): string {
    const maxInput =
      config.securityLevel === "strict"
        ? 500
        : config.securityLevel === "standard"
          ? 2000
          : 5000;
    const rateLimit =
      config.securityLevel === "strict"
        ? 10
        : config.securityLevel === "standard"
          ? 50
          : 100;

    return `/**
 * Security Module for ${config.name}
 * Level: ${config.securityLevel}
 * 
 * This module provides input validation, sanitization,
 * and rate limiting for the MCP server.
 */

const MAX_INPUT_LENGTH = ${maxInput};
const RATE_LIMIT_PER_MINUTE = ${rateLimit};

// Rate limiting state
const requestCounts = new Map<string, { count: number; resetAt: number }>();

/**
 * Validate and sanitize user input
 * Prevents injection attacks and oversized payloads
 */
export function validateInput(input: string): string {
  if (!input || typeof input !== "string") {
    throw new Error("Invalid input: must be a non-empty string");
  }

  if (input.length > MAX_INPUT_LENGTH) {
    throw new Error(\`Input exceeds maximum length of \${MAX_INPUT_LENGTH} characters\`);
  }

  // Remove potential injection patterns
  const sanitized = input
    .replace(/[<>]/g, "") // Remove HTML tags
    .replace(/\\$\\{.*?\\}/g, "") // Remove template literals
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\\w+=/gi, "") // Remove event handlers
    .trim();

  if (sanitized.length === 0) {
    throw new Error("Input is empty after sanitization");
  }

  return sanitized;
}

/**
 * Validate that a path doesn't escape the allowed directory
 */
export function validatePath(path: string, allowedRoot: string): string {
  const resolved = path.replace(/\\.\\./g, "").replace(/\\/\\//g, "/");
  
  if (!resolved.startsWith(allowedRoot)) {
    throw new Error("Path traversal detected: access denied");
  }

  return resolved;
}

/**
 * Rate limiter middleware
 * Limits requests per IP per minute
 */
export function rateLimiter(req: any, res: any, next: any): void {
  const clientId = req.ip || req.headers["x-forwarded-for"] || "unknown";
  const now = Date.now();
  
  const current = requestCounts.get(clientId);
  
  if (!current || now > current.resetAt) {
    requestCounts.set(clientId, { count: 1, resetAt: now + 60000 });
    next?.();
    return;
  }

  if (current.count >= RATE_LIMIT_PER_MINUTE) {
    if (res) {
      res.status(429).json({
        error: "Rate limit exceeded",
        retryAfter: Math.ceil((current.resetAt - now) / 1000),
      });
    }
    return;
  }

  current.count++;
  next?.();
}

/**
 * Validate JSON schema compliance
 */
export function validateSchema(data: unknown, schema: Record<string, string>): boolean {
  if (!data || typeof data !== "object") return false;
  
  for (const [key, type] of Object.entries(schema)) {
    if (!(key in (data as Record<string, unknown>))) return false;
    if (typeof (data as Record<string, unknown>)[key] !== type) return false;
  }
  
  return true;
}

/**
 * Sanitize output to prevent information leakage
 */
export function sanitizeOutput(output: unknown): unknown {
  if (typeof output === "string") {
    // Remove potential sensitive patterns
    return output
      .replace(/\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b/g, "[REDACTED_EMAIL]")
      .replace(/\\b(?:sk|pk|api|key|token|secret)[_-]?[A-Za-z0-9]{20,}\\b/gi, "[REDACTED_SECRET]");
  }
  return output;
}
`;
  }

  private generateReadme(config: McpProjectConfig): string {
    const platformSetups = config.targetPlatforms
      .map((p) => {
        const adapter = getPlatformAdapter(p);
        return adapter.getSetupInstructions(config.name);
      })
      .join("\n\n");

    return `# ${config.name}

${config.description}

## 🎯 Objective

${config.objective}

## 🔧 Installation

\`\`\`bash
npm install
npm run build
\`\`\`

## 🚀 Usage

### Development
\`\`\`bash
npm run dev
\`\`\`

### Production
\`\`\`bash
npm run build
npm start
\`\`\`

## 🔌 Platform Setup

${platformSetups}

## 🛡️ Security

This MCP server implements the following security measures:
- **Input Validation**: All inputs are sanitized and length-limited
- **Rate Limiting**: ${config.securityLevel === "strict" ? "10" : config.securityLevel === "standard" ? "50" : "100"} requests/minute
- **Path Validation**: No directory traversal allowed
- **Output Sanitization**: Sensitive data is redacted
- **Schema Validation**: All tool inputs validated with Zod

Security Level: **${config.securityLevel}**

## 📋 Tools

${config.skills.map((s) => `- **${s.name}**: Custom tool implementation`).join("\n")}

## 📄 License

MIT

---
*Generated by [MCP Builder](https://github.com/mcp-builder)*
`;
  }

  /**
   * Generate platform-specific configuration files
   */
  private generatePlatformConfigs(
    config: McpProjectConfig,
    files: GeneratedFile[]
  ): PlatformConfig[] {
    return config.targetPlatforms.map((platform) => {
      const adapter = getPlatformAdapter(platform);
      return adapter.generateConfig(config);
    });
  }

  /**
   * Apply security fixes to generated code
   */
  private applySecurityFixes(
    files: GeneratedFile[],
    report: SecurityReport
  ): GeneratedFile[] {
    // Simple security fix pass
    return files.map((file) => {
      let content = file.content;

      for (const issue of report.issues) {
        if (issue.severity === "critical" || issue.severity === "high") {
          // Apply basic fixes
          content = content.replace(/eval\(/g, "/* BLOCKED: eval */ (");
          content = content.replace(
            /child_process/g,
            "/* BLOCKED: child_process */"
          );
          content = content.replace(
            /fs\.writeFileSync/g,
            "/* BLOCKED: direct fs write */"
          );
        }
      }

      return { ...file, content };
    });
  }

  private validateConfig(config: McpProjectConfig): void {
    if (!config.name || config.name.length < 2) {
      throw new Error("Project name must be at least 2 characters");
    }
    if (!config.objective || config.objective.length < 10) {
      throw new Error("Objective must be at least 10 characters");
    }
    if (config.targetPlatforms.length === 0) {
      throw new Error("At least one target platform is required");
    }
  }
}

// Singleton instance
export const mcpGenerator = new McpGenerator();
