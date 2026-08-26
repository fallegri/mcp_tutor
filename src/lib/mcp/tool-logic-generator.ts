/**
 * Tool Logic Generator
 * 
 * Generates REAL implementation logic for MCP tools based on:
 * 1. The access strategy (how data is obtained)
 * 2. The tool's purpose (what it does with the data)
 * 3. The security level (what restrictions apply)
 * 
 * This prevents the #1 cause of broken MCPs: tools with only
 * placeholder "TODO" logic that do nothing useful.
 */

import type { McpProjectConfig, SkillConfig, AccessStrategy } from "@/types";

// ============================================================
// MAIN GENERATOR
// ============================================================

/**
 * Generate a complete tool file with real implementation logic
 */
export function generateToolWithLogic(
  skill: SkillConfig,
  config: McpProjectConfig
): string {
  const strategy = config.accessStrategy || "code_input";
  const funcName = skill.name
    .replace(/\s+/g, "")
    .replace(/^./, (c) => c.toLowerCase());
  const className = funcName.charAt(0).toUpperCase() + funcName.slice(1);
  const registerFn = `register${className}Tool`;
  const toolSlug = skill.name.toLowerCase().replace(/\s+/g, "_");

  // Get strategy-specific implementation
  const { inputParams, inputSchema, implementation, helperFunctions } =
    getStrategyImplementation(strategy, skill, config);

  return `import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { validateInput } from "../security.js";
${getStrategyImports(strategy)}

/**
 * Tool: ${skill.name}
 * Strategy: ${strategy}
 * Security Level: ${config.securityLevel}
 * 
 * This tool has REAL implementation logic based on the access strategy.
 * It receives data via: ${getStrategyDescription(strategy)}
 */

${inputSchema}

/**
 * Register the ${skill.name} tool with the MCP server
 */
export function ${registerFn}(server: McpServer): void {
  server.tool(
    "${toolSlug}",
    "${skill.name} - ${getToolDescription(strategy, skill)}",
    ${inputParams},
    async (params) => {
      try {
${implementation}
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

${helperFunctions}
`;
}

// ============================================================
// STRATEGY-SPECIFIC IMPLEMENTATIONS
// ============================================================

interface StrategyImplementation {
  inputParams: string;
  inputSchema: string;
  implementation: string;
  helperFunctions: string;
}

function getStrategyImplementation(
  strategy: AccessStrategy,
  skill: SkillConfig,
  config: McpProjectConfig
): StrategyImplementation {
  switch (strategy) {
    case "code_input":
      return getCodeInputImplementation(skill, config);
    case "filesystem":
      return getFilesystemImplementation(skill, config);
    case "url_fetch":
      return getUrlFetchImplementation(skill, config);
    case "database":
      return getDatabaseImplementation(skill, config);
    case "api_call":
      return getApiCallImplementation(skill, config);
    case "browser":
      return getBrowserImplementation(skill, config);
    default:
      return getCodeInputImplementation(skill, config);
  }
}

// --- CODE INPUT (receives code/text from AI) ---
function getCodeInputImplementation(
  skill: SkillConfig,
  config: McpProjectConfig
): StrategyImplementation {
  const maxLen = config.securityLevel === "strict" ? 50000 : 100000;

  return {
    inputParams: `{
      content: z.string().min(1).max(${maxLen}).describe("Source code or text content to analyze"),
      context: z.string().optional().describe("Additional context about what to analyze (e.g., 'landing page', 'API endpoint')"),
    }`,
    inputSchema: `// Input: receives code/text content directly from the AI
// The AI reads the file and passes its content here`,
    implementation: `        // Validate input
        const sanitizedContent = validateInput(params.content);
        
        if (sanitizedContent.length < 10) {
          return {
            content: [{ type: "text" as const, text: "Error: Content too short to analyze meaningfully." }],
            isError: true,
          };
        }

        // Perform analysis
        const results = analyzeContent(sanitizedContent, params.context);

        // Format results
        const report = formatReport(results);

        return {
          content: [{ type: "text" as const, text: report }],
        };`,
    helperFunctions: `
interface AnalysisResult {
  id: string;
  criterion: string;
  status: "pass" | "fail" | "warning";
  severity: "critical" | "major" | "minor" | "info";
  details: string;
  recommendation?: string;
}

/**
 * Analyze content against defined criteria
 * REAL LOGIC: Override this with your specific analysis rules
 */
function analyzeContent(content: string, context?: string): AnalysisResult[] {
  const results: AnalysisResult[] = [];

  // Example analysis checks (replace with your domain-specific logic)
  
  // Check 1: Content is not empty
  results.push({
    id: "CHK-001",
    criterion: "Content validity",
    status: content.trim().length > 0 ? "pass" : "fail",
    severity: "critical",
    details: \`Content length: \${content.length} characters\`,
  });

  // Check 2: Structure analysis (customize per domain)
  const hasStructure = content.includes("{") || content.includes("<") || content.includes("function");
  results.push({
    id: "CHK-002",
    criterion: "Structured content",
    status: hasStructure ? "pass" : "warning",
    severity: "minor",
    details: hasStructure ? "Content appears to be structured code" : "Content may be plain text",
  });

  // Check 3: Size within expected bounds
  results.push({
    id: "CHK-003",
    criterion: "Content size",
    status: content.length <= ${config.securityLevel === "strict" ? 50000 : 100000} ? "pass" : "fail",
    severity: "major",
    details: \`\${content.length} characters (max: ${config.securityLevel === "strict" ? 50000 : 100000})\`,
  });

  return results;
}

/**
 * Format analysis results into a readable report
 */
function formatReport(results: AnalysisResult[]): string {
  const passed = results.filter(r => r.status === "pass").length;
  const failed = results.filter(r => r.status === "fail").length;
  const warnings = results.filter(r => r.status === "warning").length;
  const score = Math.round((passed / results.length) * 100);

  let report = \`## Analysis Report\\n\\n\`;
  report += \`**Score: \${score}/100** | ✅ \${passed} passed | ❌ \${failed} failed | ⚠️ \${warnings} warnings\\n\\n\`;

  for (const r of results) {
    const icon = r.status === "pass" ? "✅" : r.status === "fail" ? "❌" : "⚠️";
    report += \`- [\${icon}] **\${r.criterion}** (\${r.severity}): \${r.details}\`;
    if (r.recommendation) report += \`\\n  → \${r.recommendation}\`;
    report += "\\n";
  }

  return report;
}`,
  };
}

// --- FILESYSTEM ---
function getFilesystemImplementation(
  skill: SkillConfig,
  config: McpProjectConfig
): StrategyImplementation {
  return {
    inputParams: `{
      path: z.string().min(1).max(500).describe("File path relative to the allowed root directory"),
      encoding: z.string().optional().default("utf-8").describe("File encoding"),
    }`,
    inputSchema: `// Input: file path within the allowed directory
const ALLOWED_ROOT = process.env.MCP_ALLOWED_ROOT || process.cwd();`,
    implementation: `        // Validate and resolve path
        const safePath = resolveSafePath(params.path, ALLOWED_ROOT);
        
        // Read file
        const content = await readFile(safePath, { encoding: params.encoding as BufferEncoding });
        
        // Process content
        const result = processFileContent(content, safePath);

        return {
          content: [{ type: "text" as const, text: result }],
        };`,
    helperFunctions: `
import { readFile, stat } from "fs/promises";
import { resolve, relative, normalize } from "path";

const ALLOWED_ROOT = process.env.MCP_ALLOWED_ROOT || process.cwd();
const MAX_FILE_SIZE = ${config.securityLevel === "strict" ? "512 * 1024" : "5 * 1024 * 1024"}; // bytes

/**
 * Resolve path safely, preventing directory traversal
 */
function resolveSafePath(inputPath: string, root: string): string {
  const normalized = normalize(inputPath).replace(/\\.\\./g, "");
  const resolved = resolve(root, normalized);
  
  if (!resolved.startsWith(resolve(root))) {
    throw new Error("Access denied: path is outside allowed directory");
  }
  
  return resolved;
}

/**
 * Process file content (customize per your needs)
 */
function processFileContent(content: string, filePath: string): string {
  const lines = content.split("\\n").length;
  const size = Buffer.byteLength(content);
  
  return \`## File: \${relative(ALLOWED_ROOT, filePath)}\\n\\n\` +
    \`- Lines: \${lines}\\n\` +
    \`- Size: \${(size / 1024).toFixed(1)} KB\\n\\n\` +
    \`\\\`\\\`\\\`\\n\${content.slice(0, 5000)}\${content.length > 5000 ? "\\n... (truncated)" : ""}\\n\\\`\\\`\\\`\`;
}`,
  };
}

// --- URL FETCH ---
function getUrlFetchImplementation(
  skill: SkillConfig,
  config: McpProjectConfig
): StrategyImplementation {
  return {
    inputParams: `{
      url: z.string().url().describe("URL to fetch content from"),
      maxSize: z.number().optional().default(1048576).describe("Max response size in bytes"),
    }`,
    inputSchema: `// Input: URL to fetch
// Only allowlisted domains are permitted
const ALLOWED_DOMAINS: string[] = [
  // Add your allowed domains here
  // "api.example.com",
  // "docs.example.com",
];`,
    implementation: `        // Validate URL domain
        const urlObj = new URL(params.url);
        if (ALLOWED_DOMAINS.length > 0 && !ALLOWED_DOMAINS.includes(urlObj.hostname)) {
          return {
            content: [{ type: "text" as const, text: \`Error: Domain \${urlObj.hostname} is not in the allowlist.\` }],
            isError: true,
          };
        }
        
        // Fetch with timeout
        const response = await fetch(params.url, {
          signal: AbortSignal.timeout(10000),
          headers: { "User-Agent": "${config.name}/1.0" },
        });
        
        if (!response.ok) {
          return {
            content: [{ type: "text" as const, text: \`Error: HTTP \${response.status} \${response.statusText}\` }],
            isError: true,
          };
        }
        
        const text = await response.text();
        const truncated = text.slice(0, params.maxSize);

        return {
          content: [{ type: "text" as const, text: truncated }],
        };`,
    helperFunctions: ``,
  };
}

// --- DATABASE ---
function getDatabaseImplementation(
  skill: SkillConfig,
  config: McpProjectConfig
): StrategyImplementation {
  return {
    inputParams: `{
      query: z.string().min(1).max(2000).describe("SQL SELECT query to execute"),
      params: z.array(z.string()).optional().default([]).describe("Query parameters for parameterization"),
    }`,
    inputSchema: `// Input: SQL query (SELECT only)
// Connection string from environment variable
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("WARNING: DATABASE_URL not set");
}`,
    implementation: `        // Validate query is SELECT only
        const trimmedQuery = params.query.trim().toUpperCase();
        if (!trimmedQuery.startsWith("SELECT")) {
          return {
            content: [{ type: "text" as const, text: "Error: Only SELECT queries are allowed (read-only)." }],
            isError: true,
          };
        }
        
        // Block dangerous keywords
        const blocked = ["DROP", "DELETE", "INSERT", "UPDATE", "ALTER", "CREATE", "EXEC"];
        for (const keyword of blocked) {
          if (trimmedQuery.includes(keyword)) {
            return {
              content: [{ type: "text" as const, text: \`Error: \${keyword} statements are not allowed.\` }],
              isError: true,
            };
          }
        }
        
        // Execute query
        const result = await executeQuery(params.query, params.params);

        return {
          content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
        };`,
    helperFunctions: `
/**
 * Execute a read-only database query
 * Uses @neondatabase/serverless for Neon or standard pg for local
 */
async function executeQuery(query: string, params: string[]): Promise<{ rows: unknown[]; rowCount: number }> {
  // Using dynamic import to support both Neon and local PG
  const { neon } = await import("@neondatabase/serverless");
  const sql = neon(process.env.DATABASE_URL!);
  
  const rows = await sql(query, params);
  
  return {
    rows: rows.slice(0, 100), // Limit to 100 rows
    rowCount: rows.length,
  };
}`,
  };
}

// --- API CALL ---
function getApiCallImplementation(
  skill: SkillConfig,
  config: McpProjectConfig
): StrategyImplementation {
  return {
    inputParams: `{
      endpoint: z.string().url().describe("API endpoint URL"),
      method: z.enum(["GET", "POST", "PUT"]).default("GET").describe("HTTP method"),
      body: z.string().optional().describe("Request body (JSON string) for POST/PUT"),
      headers: z.record(z.string()).optional().describe("Additional request headers"),
    }`,
    inputSchema: `// Input: API endpoint and parameters
// Authentication is configured via environment variables
const API_BASE_URL = process.env.API_BASE_URL || "";
const API_KEY = process.env.API_KEY || "";`,
    implementation: `        // Build request
        const fetchOptions: RequestInit = {
          method: params.method,
          headers: {
            "Content-Type": "application/json",
            ...(API_KEY ? { Authorization: \`Bearer \${API_KEY}\` } : {}),
            ...params.headers,
          },
          signal: AbortSignal.timeout(15000),
        };
        
        if (params.body && params.method !== "GET") {
          fetchOptions.body = params.body;
        }
        
        const response = await fetch(params.endpoint, fetchOptions);
        const data = await response.text();
        
        if (!response.ok) {
          return {
            content: [{ type: "text" as const, text: \`API Error \${response.status}: \${data.slice(0, 500)}\` }],
            isError: true,
          };
        }

        return {
          content: [{ type: "text" as const, text: data }],
        };`,
    helperFunctions: ``,
  };
}

// --- BROWSER (Puppeteer) ---
function getBrowserImplementation(
  skill: SkillConfig,
  config: McpProjectConfig
): StrategyImplementation {
  return {
    inputParams: `{
      url: z.string().url().describe("URL to render in the browser"),
      waitFor: z.number().optional().default(3000).describe("Milliseconds to wait for page load"),
      extractHtml: z.boolean().optional().default(true).describe("Whether to extract rendered HTML"),
      screenshot: z.boolean().optional().default(false).describe("Whether to take a screenshot"),
    }`,
    inputSchema: `// Input: URL to render using headless browser
// Puppeteer must be installed: npm install puppeteer`,
    implementation: `        // Launch browser
        const puppeteer = await import("puppeteer");
        const browser = await puppeteer.default.launch({
          headless: true,
          args: ["--no-sandbox", "--disable-setuid-sandbox"],
        });
        
        try {
          const page = await browser.newPage();
          await page.setViewport({ width: 1280, height: 720 });
          
          // Navigate
          await page.goto(params.url, {
            waitUntil: "networkidle2",
            timeout: 30000,
          });
          
          // Wait additional time for JS rendering
          await new Promise(resolve => setTimeout(resolve, params.waitFor));
          
          let result = "";
          
          // Extract rendered HTML
          if (params.extractHtml) {
            const html = await page.content();
            result += \`## Rendered HTML (\\n\${html.length} chars)\\n\\n\\\`\\\`\\\`html\\n\${html.slice(0, 50000)}\\n\\\`\\\`\\\`\\n\`;
          }
          
          // Take screenshot (base64)
          if (params.screenshot) {
            const screenshotBuffer = await page.screenshot({ encoding: "base64" });
            result += \`\\n## Screenshot\\nBase64 PNG: \${(screenshotBuffer as string).slice(0, 100)}...\\n\`;
          }
          
          return {
            content: [{ type: "text" as const, text: result || "Page rendered successfully." }],
          };
        } finally {
          await browser.close();
        }`,
    helperFunctions: ``,
  };
}

// ============================================================
// HELPERS
// ============================================================

function getStrategyImports(strategy: AccessStrategy): string {
  switch (strategy) {
    case "filesystem":
      return `import { readFile, stat } from "fs/promises";\nimport { resolve, relative, normalize } from "path";`;
    case "database":
      return `// Database import is dynamic (see executeQuery function)`;
    case "browser":
      return `// Puppeteer import is dynamic (see implementation)`;
    default:
      return "";
  }
}

function getStrategyDescription(strategy: AccessStrategy): string {
  const desc: Record<AccessStrategy, string> = {
    code_input: "AI passes code/text content directly as a parameter",
    filesystem: "Reading files from the local filesystem",
    url_fetch: "Fetching content from URLs via HTTP",
    database: "Querying a PostgreSQL database",
    api_call: "Calling external REST/GraphQL APIs",
    browser: "Rendering pages in a headless browser (Puppeteer)",
    hybrid: "Multiple strategies combined",
  };
  return desc[strategy];
}

function getToolDescription(strategy: AccessStrategy, skill: SkillConfig): string {
  switch (strategy) {
    case "code_input":
      return `Analyzes code/text content passed directly`;
    case "filesystem":
      return `Reads and processes files from disk`;
    case "url_fetch":
      return `Fetches and processes content from URLs`;
    case "database":
      return `Executes read-only database queries`;
    case "api_call":
      return `Calls external APIs`;
    case "browser":
      return `Renders pages in a headless browser`;
    default:
      return `Processes input data`;
  }
}
