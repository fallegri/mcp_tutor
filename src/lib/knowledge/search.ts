import type { KnowledgeSearchResult } from "@/types";

/**
 * Knowledge Base Search Engine
 * 
 * Provides semantic search over the knowledge base of known MCPs,
 * patterns, and best practices. Uses text matching with relevance scoring.
 */

// In-memory knowledge base for immediate availability
// In production, this would be backed by Neon PostgreSQL with pg_trgm extension
const KNOWLEDGE_ENTRIES: KnowledgeEntry[] = [
  {
    id: "kb-001",
    title: "GitHub MCP Server",
    description:
      "MCP server for GitHub operations: create issues, manage PRs, review code, search repositories",
    category: "source-control",
    tags: ["github", "git", "issues", "pull-requests", "code-review"],
    platform: "universal",
    difficulty: "intermediate",
    content: `GitHub MCP Server provides tools for interacting with GitHub's API through MCP. 
It can create issues, manage pull requests, search code, and perform code reviews.
Key patterns: OAuth authentication, pagination handling, rate limit management.`,
  },
  {
    id: "kb-002",
    title: "Database Query MCP",
    description:
      "MCP server for safe read-only database queries with schema exploration",
    category: "database",
    tags: ["sql", "postgresql", "mysql", "database", "query"],
    platform: "universal",
    difficulty: "intermediate",
    content: `Database MCP servers provide safe, read-only access to databases.
Key patterns: Connection pooling, query parameterization (prevent SQL injection),
result pagination, schema introspection, timeout management.`,
  },
  {
    id: "kb-003",
    title: "File System MCP",
    description:
      "MCP server for safe file operations within restricted directories",
    category: "filesystem",
    tags: ["files", "read", "write", "directory", "filesystem"],
    platform: "universal",
    difficulty: "beginner",
    content: `File System MCP provides controlled access to local files.
Key patterns: Path validation (prevent traversal), allowlisted directories,
read/write permissions per path, file size limits, binary file handling.`,
  },
  {
    id: "kb-004",
    title: "Web Search MCP",
    description:
      "MCP server for searching the web and fetching web page content",
    category: "web",
    tags: ["search", "web", "fetch", "scraping", "http"],
    platform: "universal",
    difficulty: "intermediate",
    content: `Web Search MCP allows AI to search the internet and fetch content.
Key patterns: Rate limiting external APIs, content extraction, URL validation,
response caching, content size limits, robots.txt compliance.`,
  },
  {
    id: "kb-005",
    title: "Slack Integration MCP",
    description:
      "MCP server for Slack: send messages, read channels, manage threads",
    category: "communication",
    tags: ["slack", "messaging", "chat", "notifications", "teams"],
    platform: "universal",
    difficulty: "intermediate",
    content: `Slack MCP enables AI to interact with Slack workspaces.
Key patterns: OAuth2 authentication, WebSocket for real-time, message formatting,
channel management, file uploads, thread handling.`,
  },
  {
    id: "kb-006",
    title: "Docker MCP Server",
    description:
      "MCP server for Docker container management: build, run, inspect containers",
    category: "devops",
    tags: ["docker", "containers", "devops", "deploy", "kubernetes"],
    platform: "universal",
    difficulty: "advanced",
    content: `Docker MCP provides container lifecycle management.
Key patterns: Docker API interaction, image security scanning, resource limits,
network isolation, volume management, log streaming.`,
  },
  {
    id: "kb-007",
    title: "API Documentation MCP",
    description:
      "MCP server that provides access to API documentation and specs",
    category: "documentation",
    tags: ["api", "docs", "openapi", "swagger", "rest"],
    platform: "universal",
    difficulty: "beginner",
    content: `API Documentation MCP serves structured API docs to AI.
Key patterns: OpenAPI/Swagger parsing, endpoint discovery, schema validation,
example generation, authentication guidance.`,
  },
  {
    id: "kb-008",
    title: "Testing MCP Server",
    description:
      "MCP server for running tests, analyzing coverage, and reporting results",
    category: "testing",
    tags: ["testing", "jest", "pytest", "coverage", "ci"],
    platform: "universal",
    difficulty: "intermediate",
    content: `Testing MCP enables AI to run and analyze test suites.
Key patterns: Test runner abstraction, coverage parsing, failure analysis,
snapshot testing, parallel execution, timeout management.`,
  },
  {
    id: "kb-009",
    title: "Figma Design MCP",
    description:
      "MCP server for reading Figma designs and extracting component information",
    category: "design",
    tags: ["figma", "design", "ui", "components", "tokens"],
    platform: "universal",
    difficulty: "advanced",
    content: `Figma MCP provides access to design files and components.
Key patterns: OAuth authentication, design token extraction, component tree parsing,
asset downloading, layout analysis.`,
  },
  {
    id: "kb-010",
    title: "Monitoring & Observability MCP",
    description:
      "MCP server for querying metrics, logs, and traces from observability platforms",
    category: "observability",
    tags: ["monitoring", "logs", "metrics", "traces", "datadog", "grafana"],
    platform: "universal",
    difficulty: "advanced",
    content: `Observability MCP provides AI access to system health data.
Key patterns: PromQL/LogQL query building, time range handling, alert correlation,
dashboard generation, anomaly detection hints.`,
  },
];

/**
 * Search the knowledge base for relevant entries
 */
export function searchKnowledge(
  query: string,
  limit: number = 5
): KnowledgeSearchResult[] {
  if (!query || query.trim().length === 0) return [];

  const queryTokens = tokenize(query.toLowerCase());

  const scored = KNOWLEDGE_ENTRIES.map((entry) => {
    const score = calculateRelevance(queryTokens, entry);
    return {
      id: entry.id,
      title: entry.title,
      description: entry.description,
      relevanceScore: score,
      category: entry.category,
      tags: entry.tags,
    };
  })
    .filter((r) => r.relevanceScore > 0.1)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, limit);

  return scored;
}

/**
 * Get knowledge entry by ID
 */
export function getKnowledgeEntry(id: string): KnowledgeEntry | undefined {
  return KNOWLEDGE_ENTRIES.find((e) => e.id === id);
}

/**
 * Get all categories
 */
export function getCategories(): string[] {
  return [...new Set(KNOWLEDGE_ENTRIES.map((e) => e.category))];
}

/**
 * Get suggestions based on objective
 */
export function getSuggestedSkills(objective: string): string[] {
  const results = searchKnowledge(objective, 3);
  const suggestions: string[] = [];

  for (const result of results) {
    const entry = getKnowledgeEntry(result.id);
    if (entry) {
      suggestions.push(...entry.tags.slice(0, 2));
    }
  }

  return [...new Set(suggestions)];
}

// ============ HELPERS ============

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2);
}

function calculateRelevance(
  queryTokens: string[],
  entry: KnowledgeEntry
): number {
  let score = 0;
  const entryText = [
    entry.title,
    entry.description,
    entry.content,
    ...entry.tags,
    entry.category,
  ]
    .join(" ")
    .toLowerCase();

  const entryTokens = tokenize(entryText);

  for (const qToken of queryTokens) {
    // Exact match in title (high weight)
    if (entry.title.toLowerCase().includes(qToken)) {
      score += 0.3;
    }
    // Match in tags (medium weight)
    if (entry.tags.some((t) => t.includes(qToken))) {
      score += 0.25;
    }
    // Match in description (medium weight)
    if (entry.description.toLowerCase().includes(qToken)) {
      score += 0.2;
    }
    // Match in content (low weight)
    if (entryTokens.includes(qToken)) {
      score += 0.1;
    }
    // Partial match
    if (entryTokens.some((t) => t.includes(qToken) || qToken.includes(t))) {
      score += 0.05;
    }
  }

  // Normalize by query length
  return Math.min(1.0, score / Math.max(1, queryTokens.length * 0.3));
}

interface KnowledgeEntry {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  platform: string;
  difficulty: string;
  content: string;
}
