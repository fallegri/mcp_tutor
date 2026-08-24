/**
 * Database Seed Script
 * 
 * Populates the initial knowledge base, templates, and security rules.
 * Run with: npm run db:seed
 */

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

async function seed() {
  if (!process.env.DATABASE_URL) {
    console.log("⚠️  DATABASE_URL not set. Using placeholder for demo.");
    console.log("   Set DATABASE_URL to seed a real Neon database.");
    console.log("\n📋 Seed data that would be inserted:\n");
    printSeedData();
    return;
  }

  const sql = neon(process.env.DATABASE_URL);
  const db = drizzle(sql, { schema });

  console.log("🌱 Seeding database...\n");

  // Seed Knowledge Base
  console.log("📚 Seeding knowledge base...");
  await db.insert(schema.knowledgeBase).values([
    {
      title: "GitHub MCP Server",
      description:
        "MCP server for GitHub operations: issues, PRs, code review",
      category: "source-control",
      tags: ["github", "git", "issues", "pull-requests"],
      sourceUrl: "https://github.com/github/github-mcp-server",
      content:
        "GitHub MCP provides full GitHub API access through tools. Supports issues, pull requests, code search, and repository management.",
      platform: "universal",
      difficulty: "intermediate",
    },
    {
      title: "PostgreSQL MCP Server",
      description: "Safe read-only database query MCP server",
      category: "database",
      tags: ["postgresql", "database", "sql", "query"],
      content:
        "Database MCP provides safe read-only access with parameterized queries, connection pooling, and query timeout management.",
      platform: "universal",
      difficulty: "intermediate",
    },
    {
      title: "Filesystem MCP Server",
      description: "Controlled file access within specified directories",
      category: "filesystem",
      tags: ["files", "filesystem", "read", "write"],
      content:
        "File system access with path validation, directory restrictions, size limits, and read/write permission controls.",
      platform: "universal",
      difficulty: "beginner",
    },
  ]);

  // Seed Skills
  console.log("🔧 Seeding skills...");
  await db.insert(schema.skills).values([
    {
      name: "File Reader",
      slug: "file-reader",
      description: "Read files from specified directories with security checks",
      category: "filesystem",
      codeTemplate: `server.tool("read_file", "Read a file", { path: z.string() }, async ({ path }) => { /* ... */ });`,
      securityRequirements: ["path_validation", "size_limit"],
      compatiblePlatforms: ["claude_code", "openai_codex", "universal"],
      isBuiltin: true,
    },
    {
      name: "Web Fetcher",
      slug: "web-fetcher",
      description: "Fetch content from URLs with domain restrictions",
      category: "network",
      codeTemplate: `server.tool("fetch_url", "Fetch web content", { url: z.string().url() }, async ({ url }) => { /* ... */ });`,
      securityRequirements: ["url_validation", "domain_allowlist", "timeout"],
      compatiblePlatforms: ["claude_code", "openai_codex", "universal"],
      isBuiltin: true,
    },
    {
      name: "Database Query",
      slug: "database-query",
      description: "Execute read-only SQL queries with parameterization",
      category: "database",
      codeTemplate: `server.tool("query_db", "Execute SQL query", { query: z.string() }, async ({ query }) => { /* ... */ });`,
      securityRequirements: [
        "parameterized_queries",
        "read_only",
        "timeout",
        "connection_pooling",
      ],
      compatiblePlatforms: ["claude_code", "openai_codex", "universal"],
      isBuiltin: true,
    },
  ]);

  // Seed Security Rules
  console.log("🛡️ Seeding security rules...");
  await db.insert(schema.securityRules).values([
    {
      name: "No eval()",
      description: "Block usage of eval() which allows arbitrary code execution",
      category: "code_execution",
      severity: "critical",
      pattern: "eval\\\\s*\\\\(",
      recommendation: "Use JSON.parse() for data or specific functions",
    },
    {
      name: "No hardcoded secrets",
      description: "Detect hardcoded API keys, passwords, and tokens",
      category: "information_exposure",
      severity: "critical",
      pattern:
        "(password|secret|api_key|token)\\\\s*[:=]\\\\s*['\"][^'\"]+['\"]",
      recommendation: "Use environment variables or a secrets manager",
    },
    {
      name: "Path traversal prevention",
      description: "Detect potential path traversal patterns",
      category: "filesystem",
      severity: "high",
      pattern: "\\\\.\\\\./",
      recommendation: "Use path.resolve() and validate against allowed root",
    },
  ]);

  // Seed Templates
  console.log("📄 Seeding templates...");
  await db.insert(schema.mcpTemplates).values([
    {
      name: "Basic stdio Server",
      description: "Minimal MCP server with stdio transport",
      category: "basic",
      platform: "universal",
      transport: "stdio",
      baseCode: `import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new McpServer({ name: "{{name}}", version: "1.0.0" });
const transport = new StdioServerTransport();
await server.connect(transport);`,
      requiredDependencies: ["@modelcontextprotocol/sdk", "zod"],
      securityFeatures: ["input_validation", "error_handling"],
      variables: [
        {
          name: "name",
          description: "Server name",
          type: "string",
          required: true,
        },
      ],
    },
    {
      name: "HTTP Server with Auth",
      description: "MCP server with HTTP transport and authentication",
      category: "advanced",
      platform: "universal",
      transport: "http",
      baseCode: `import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express from "express";

const app = express();
app.use(express.json());
// Auth middleware here
const server = new McpServer({ name: "{{name}}", version: "1.0.0" });`,
      requiredDependencies: [
        "@modelcontextprotocol/sdk",
        "zod",
        "express",
      ],
      securityFeatures: [
        "input_validation",
        "authentication",
        "rate_limiting",
        "cors",
      ],
      variables: [
        {
          name: "name",
          description: "Server name",
          type: "string",
          required: true,
        },
        {
          name: "port",
          description: "HTTP port",
          type: "number",
          required: false,
        },
      ],
    },
  ]);

  console.log("\n✅ Database seeded successfully!");
}

function printSeedData() {
  console.log("Knowledge Base entries: 3 (GitHub, PostgreSQL, Filesystem)");
  console.log("Skills: 3 (File Reader, Web Fetcher, Database Query)");
  console.log("Security Rules: 3 (eval, secrets, path traversal)");
  console.log("Templates: 2 (Basic stdio, HTTP with Auth)");
}

seed().catch(console.error);
