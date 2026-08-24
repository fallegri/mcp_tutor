-- ============================================================
-- MCP Builder - Datos Iniciales (Seed)
-- Compatible con: Neon PostgreSQL / PostgreSQL 14+
-- ============================================================
-- Ejecutar DESPUÉS de 001_schema.sql:
--   psql $DATABASE_URL -f database/002_seed_data.sql
-- ============================================================

-- ============================================================
-- KNOWLEDGE BASE - MCPs conocidos y patrones
-- ============================================================

INSERT INTO knowledge_base (title, description, category, tags, source_url, content, code_examples, platform, difficulty)
VALUES
-- 1. GitHub MCP
(
    'GitHub MCP Server',
    'MCP server oficial de GitHub para operaciones: crear issues, gestionar PRs, revisar código, buscar repositorios',
    'source-control',
    '["github", "git", "issues", "pull-requests", "code-review", "repositories"]'::jsonb,
    'https://github.com/github/github-mcp-server',
    'GitHub MCP Server proporciona acceso completo a la API de GitHub a través de herramientas MCP. Soporta gestión de issues, pull requests, búsqueda de código, y administración de repositorios. Usa OAuth para autenticación. Implementa paginación automática y manejo de rate limits de la API de GitHub.',
    '{"install": "claude mcp add github -- npx @github/mcp-server", "config": "{\"mcpServers\":{\"github\":{\"command\":\"npx\",\"args\":[\"@github/mcp-server\"]}}}"}'::jsonb,
    'universal',
    'intermediate'
),
-- 2. PostgreSQL MCP
(
    'PostgreSQL Database MCP',
    'MCP server para consultas seguras de solo lectura a PostgreSQL con exploración de schema',
    'database',
    '["postgresql", "database", "sql", "query", "schema", "neon"]'::jsonb,
    'https://github.com/modelcontextprotocol/servers/tree/main/src/postgres',
    'Database MCP Server proporciona acceso seguro de solo lectura a bases de datos PostgreSQL. Incluye exploración de schema, consultas parametrizadas (prevención de SQL injection), connection pooling, timeouts, y paginación de resultados. Compatible con Neon PostgreSQL serverless.',
    '{"tool_example": "server.tool(\"query\", \"Execute read-only SQL\", { sql: z.string() }, async ({sql}) => { ... })", "security": "Todas las consultas se ejecutan dentro de una transacción READ ONLY"}'::jsonb,
    'universal',
    'intermediate'
),
-- 3. Filesystem MCP
(
    'Filesystem MCP Server',
    'MCP server para operaciones de archivo controladas dentro de directorios restringidos',
    'filesystem',
    '["files", "filesystem", "read", "write", "directory", "path"]'::jsonb,
    'https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem',
    'File System MCP proporciona acceso controlado a archivos locales. Incluye validación de paths (prevención de traversal), directorios allowlisted, permisos de lectura/escritura por path, límites de tamaño de archivo, y manejo de archivos binarios. Solo permite acceso dentro de los directorios explícitamente configurados.',
    '{"config": "{\"mcpServers\":{\"filesystem\":{\"command\":\"npx\",\"args\":[\"-y\",\"@modelcontextprotocol/server-filesystem\",\"/path/to/allowed\"]}}}"}'::jsonb,
    'universal',
    'beginner'
),
-- 4. Web Search MCP
(
    'Brave Search MCP Server',
    'MCP server para búsqueda web y obtención de contenido de páginas usando Brave Search API',
    'web',
    '["search", "web", "brave", "fetch", "scraping", "http", "internet"]'::jsonb,
    'https://github.com/modelcontextprotocol/servers/tree/main/src/brave-search',
    'Brave Search MCP permite al AI buscar en internet y obtener contenido de páginas web. Implementa rate limiting de APIs externas, extracción de contenido relevante, validación de URLs, caché de respuestas, límites de tamaño de contenido, y cumplimiento con robots.txt.',
    '{"env": "BRAVE_API_KEY=your-api-key", "tools": ["brave_web_search", "brave_local_search"]}'::jsonb,
    'universal',
    'intermediate'
),
-- 5. Slack MCP
(
    'Slack Integration MCP',
    'MCP server para Slack: enviar mensajes, leer canales, gestionar hilos y reacciones',
    'communication',
    '["slack", "messaging", "chat", "notifications", "teams", "channels"]'::jsonb,
    'https://github.com/modelcontextprotocol/servers/tree/main/src/slack',
    'Slack MCP permite al AI interactuar con workspaces de Slack. Incluye autenticación OAuth2, formateo de mensajes con Blocks, gestión de canales, subida de archivos, manejo de hilos, y búsqueda de mensajes. Requiere configurar un Slack App con los scopes adecuados.',
    '{"scopes": "channels:read,chat:write,files:read,users:read", "tools": ["send_message", "read_channel", "search_messages", "add_reaction"]}'::jsonb,
    'universal',
    'intermediate'
),
-- 6. Docker MCP
(
    'Docker Container MCP',
    'MCP server para gestión de contenedores Docker: build, run, inspect, logs',
    'devops',
    '["docker", "containers", "devops", "deploy", "images", "kubernetes"]'::jsonb,
    NULL,
    'Docker MCP proporciona gestión del ciclo de vida de contenedores. Incluye interacción con Docker API, escaneo de seguridad de imágenes, límites de recursos (CPU, memoria), aislamiento de red, gestión de volúmenes, y streaming de logs. Requiere acceso al Docker socket.',
    '{"tools": ["docker_build", "docker_run", "docker_stop", "docker_logs", "docker_inspect"], "security": "Restricción de imágenes base permitidas, límites de recursos obligatorios"}'::jsonb,
    'universal',
    'advanced'
),
-- 7. Puppeteer/Browser MCP
(
    'Puppeteer Browser MCP',
    'MCP server para automatización de navegador: navegar, hacer click, screenshots, extraer datos',
    'browser',
    '["puppeteer", "browser", "automation", "screenshots", "web", "scraping"]'::jsonb,
    'https://github.com/modelcontextprotocol/servers/tree/main/src/puppeteer',
    'Puppeteer MCP permite al AI controlar un navegador headless Chrome. Puede navegar URLs, interactuar con elementos de la página, tomar screenshots, extraer contenido, y ejecutar JavaScript en la página. Incluye protecciones contra navegación a sitios maliciosos.',
    '{"tools": ["navigate", "screenshot", "click", "type", "evaluate", "get_content"], "config": "{\"mcpServers\":{\"puppeteer\":{\"command\":\"npx\",\"args\":[\"-y\",\"@modelcontextprotocol/server-puppeteer\"]}}}"}'::jsonb,
    'universal',
    'intermediate'
),
-- 8. Memory/Knowledge Graph MCP
(
    'Memory Knowledge Graph MCP',
    'MCP server para persistir y consultar conocimiento como un grafo de entidades y relaciones',
    'knowledge',
    '["memory", "knowledge-graph", "entities", "relations", "persistence", "context"]'::jsonb,
    'https://github.com/modelcontextprotocol/servers/tree/main/src/memory',
    'Memory MCP proporciona persistencia de conocimiento estructurado como un grafo. El AI puede crear entidades, definir relaciones entre ellas, y consultar el grafo. Útil para mantener contexto entre sesiones. Almacena datos en un archivo JSON local.',
    '{"tools": ["create_entities", "create_relations", "search_nodes", "read_graph", "delete_entities"], "storage": "Archivo JSON local (~/.memory/knowledge.json)"}'::jsonb,
    'universal',
    'beginner'
),
-- 9. Sentry Error Tracking MCP
(
    'Sentry Error Tracking MCP',
    'MCP server para consultar errores, issues y performance de Sentry',
    'observability',
    '["sentry", "errors", "monitoring", "debugging", "performance", "issues"]'::jsonb,
    NULL,
    'Sentry MCP permite al AI consultar datos de error tracking y performance monitoring. Puede buscar issues recientes, obtener stack traces, analizar tendencias de errores, y correlacionar con deploys. Requiere auth token de Sentry con permisos de lectura.',
    '{"tools": ["list_issues", "get_issue_details", "get_stacktrace", "search_events"], "auth": "Bearer token de Sentry (Settings > Auth Tokens)"}'::jsonb,
    'universal',
    'advanced'
),
-- 10. Linear Project Management MCP
(
    'Linear Project Management MCP',
    'MCP server para gestión de proyectos con Linear: issues, cycles, projects, teams',
    'project-management',
    '["linear", "project-management", "issues", "agile", "tasks", "sprints"]'::jsonb,
    NULL,
    'Linear MCP permite al AI interactuar con Linear para gestión de proyectos. Puede crear y actualizar issues, gestionar cycles (sprints), asignar tareas, cambiar estados, y consultar el backlog. Usa la API GraphQL de Linear.',
    '{"tools": ["create_issue", "update_issue", "list_issues", "get_cycle", "assign_issue"], "auth": "API Key de Linear (Settings > API)"}'::jsonb,
    'universal',
    'intermediate'
);

-- ============================================================
-- SKILLS - Herramientas pre-construidas
-- ============================================================

INSERT INTO skills (name, slug, description, category, input_schema, output_schema, code_template, security_requirements, compatible_platforms, dependencies, is_builtin, usage_count)
VALUES
-- Skill 1: File Reader
(
    'File Reader',
    'file-reader',
    'Lee archivos de directorios especificados con validación de seguridad. Soporta texto plano, JSON, YAML, y Markdown.',
    'filesystem',
    '{"type": "object", "properties": {"path": {"type": "string", "description": "Ruta al archivo"}, "encoding": {"type": "string", "default": "utf-8"}}, "required": ["path"]}'::jsonb,
    '{"type": "object", "properties": {"content": {"type": "string"}, "size": {"type": "number"}, "mimeType": {"type": "string"}}}'::jsonb,
    E'server.tool(\n  "read_file",\n  "Read a file from the allowed directory",\n  {\n    path: z.string().describe("File path relative to allowed root"),\n    encoding: z.string().optional().default("utf-8"),\n  },\n  async ({ path, encoding }) => {\n    const safePath = validatePath(path, ALLOWED_ROOT);\n    const content = await fs.readFile(safePath, encoding);\n    return {\n      content: [{ type: "text", text: content }],\n    };\n  }\n);',
    '["path_validation", "size_limit", "allowed_extensions"]'::jsonb,
    '["claude_code", "openai_codex", "opencode", "cursor", "kiro", "universal"]'::jsonb,
    '["fs/promises"]'::jsonb,
    TRUE,
    156
),
-- Skill 2: Web Fetcher
(
    'Web Fetcher',
    'web-fetcher',
    'Obtiene contenido de URLs con restricciones de dominio, timeout, y límite de tamaño. Extrae texto limpio del HTML.',
    'network',
    '{"type": "object", "properties": {"url": {"type": "string", "format": "uri"}, "maxSize": {"type": "number", "default": 1048576}}, "required": ["url"]}'::jsonb,
    '{"type": "object", "properties": {"content": {"type": "string"}, "statusCode": {"type": "number"}, "contentType": {"type": "string"}}}'::jsonb,
    E'server.tool(\n  "fetch_url",\n  "Fetch content from a URL (allowlisted domains only)",\n  {\n    url: z.string().url().describe("URL to fetch"),\n    maxSize: z.number().optional().default(1048576),\n  },\n  async ({ url, maxSize }) => {\n    validateUrl(url, ALLOWED_DOMAINS);\n    const response = await fetch(url, { signal: AbortSignal.timeout(10000) });\n    const text = await response.text();\n    return {\n      content: [{ type: "text", text: text.slice(0, maxSize) }],\n    };\n  }\n);',
    '["url_validation", "domain_allowlist", "timeout", "size_limit"]'::jsonb,
    '["claude_code", "openai_codex", "opencode", "cursor", "kiro", "universal"]'::jsonb,
    '[]'::jsonb,
    TRUE,
    203
),
-- Skill 3: Database Query
(
    'Database Query',
    'database-query',
    'Ejecuta consultas SQL de solo lectura con parametrización. Previene injection y limita resultados.',
    'database',
    '{"type": "object", "properties": {"query": {"type": "string"}, "params": {"type": "array", "items": {"type": "string"}}}, "required": ["query"]}'::jsonb,
    '{"type": "object", "properties": {"rows": {"type": "array"}, "rowCount": {"type": "number"}, "columns": {"type": "array"}}}'::jsonb,
    E'server.tool(\n  "query_database",\n  "Execute a read-only SQL query",\n  {\n    query: z.string().describe("SQL query (SELECT only)"),\n    params: z.array(z.string()).optional().default([]),\n  },\n  async ({ query, params }) => {\n    if (!query.trim().toUpperCase().startsWith("SELECT")) {\n      throw new Error("Only SELECT queries are allowed");\n    }\n    const result = await pool.query(query, params);\n    return {\n      content: [{ type: "text", text: JSON.stringify(result.rows, null, 2) }],\n    };\n  }\n);',
    '["parameterized_queries", "read_only", "timeout", "connection_pooling", "row_limit"]'::jsonb,
    '["claude_code", "openai_codex", "opencode", "cursor", "kiro", "universal"]'::jsonb,
    '["pg", "@neondatabase/serverless"]'::jsonb,
    TRUE,
    189
),
-- Skill 4: JSON Transformer
(
    'JSON Transformer',
    'json-transformer',
    'Transforma datos JSON usando JMESPath queries. Útil para extraer y reformatear datos estructurados.',
    'data-processing',
    '{"type": "object", "properties": {"data": {"type": "string"}, "expression": {"type": "string"}}, "required": ["data", "expression"]}'::jsonb,
    '{"type": "object", "properties": {"result": {}}}'::jsonb,
    E'server.tool(\n  "transform_json",\n  "Transform JSON data using a JMESPath expression",\n  {\n    data: z.string().describe("JSON string to transform"),\n    expression: z.string().describe("JMESPath expression"),\n  },\n  async ({ data, expression }) => {\n    const parsed = JSON.parse(data);\n    const result = jmespath.search(parsed, expression);\n    return {\n      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],\n    };\n  }\n);',
    '["input_validation", "size_limit"]'::jsonb,
    '["claude_code", "openai_codex", "opencode", "cursor", "kiro", "universal"]'::jsonb,
    '["jmespath"]'::jsonb,
    TRUE,
    87
),
-- Skill 5: Shell Command (Restricted)
(
    'Shell Command (Restricted)',
    'shell-command-restricted',
    'Ejecuta comandos shell de una lista blanca predefinida. Solo comandos seguros y no destructivos.',
    'system',
    '{"type": "object", "properties": {"command": {"type": "string"}, "args": {"type": "array", "items": {"type": "string"}}}, "required": ["command"]}'::jsonb,
    '{"type": "object", "properties": {"stdout": {"type": "string"}, "stderr": {"type": "string"}, "exitCode": {"type": "number"}}}'::jsonb,
    E'const ALLOWED_COMMANDS = ["ls", "cat", "head", "tail", "wc", "grep", "find", "echo", "date"];\n\nserver.tool(\n  "run_command",\n  "Run a whitelisted shell command",\n  {\n    command: z.string().describe("Command to run (from allowlist)"),\n    args: z.array(z.string()).optional().default([]),\n  },\n  async ({ command, args }) => {\n    if (!ALLOWED_COMMANDS.includes(command)) {\n      throw new Error(`Command not allowed. Permitted: ${ALLOWED_COMMANDS.join(", ")}`);\n    }\n    const { stdout, stderr } = await execFile(command, args, { timeout: 5000 });\n    return {\n      content: [{ type: "text", text: stdout || stderr }],\n    };\n  }\n);',
    '["command_allowlist", "timeout", "no_shell_expansion", "restricted_args"]'::jsonb,
    '["claude_code", "openai_codex", "universal"]'::jsonb,
    '["child_process"]'::jsonb,
    TRUE,
    64
),
-- Skill 6: HTTP API Caller
(
    'HTTP API Caller',
    'http-api-caller',
    'Realiza llamadas HTTP a APIs externas con autenticación configurable, retry, y manejo de errores.',
    'network',
    '{"type": "object", "properties": {"url": {"type": "string"}, "method": {"type": "string", "enum": ["GET", "POST", "PUT", "DELETE"]}, "headers": {"type": "object"}, "body": {"type": "string"}}, "required": ["url", "method"]}'::jsonb,
    '{"type": "object", "properties": {"status": {"type": "number"}, "headers": {"type": "object"}, "body": {"type": "string"}}}'::jsonb,
    E'server.tool(\n  "call_api",\n  "Make an HTTP request to an external API",\n  {\n    url: z.string().url(),\n    method: z.enum(["GET", "POST", "PUT", "DELETE"]),\n    headers: z.record(z.string()).optional(),\n    body: z.string().optional(),\n  },\n  async ({ url, method, headers, body }) => {\n    validateUrl(url, ALLOWED_API_DOMAINS);\n    const response = await fetch(url, {\n      method,\n      headers: { "Content-Type": "application/json", ...headers },\n      body: method !== "GET" ? body : undefined,\n      signal: AbortSignal.timeout(15000),\n    });\n    const data = await response.text();\n    return {\n      content: [{ type: "text", text: data }],\n    };\n  }\n);',
    '["url_validation", "domain_allowlist", "timeout", "rate_limiting", "auth_header_protection"]'::jsonb,
    '["claude_code", "openai_codex", "opencode", "cursor", "kiro", "universal"]'::jsonb,
    '[]'::jsonb,
    TRUE,
    142
),
-- Skill 7: Text Analyzer
(
    'Text Analyzer',
    'text-analyzer',
    'Analiza texto: cuenta palabras, detecta idioma, extrae keywords, calcula legibilidad.',
    'data-processing',
    '{"type": "object", "properties": {"text": {"type": "string"}, "analyses": {"type": "array", "items": {"type": "string", "enum": ["word_count", "language", "keywords", "readability"]}}}, "required": ["text"]}'::jsonb,
    '{"type": "object", "properties": {"wordCount": {"type": "number"}, "language": {"type": "string"}, "keywords": {"type": "array"}, "readabilityScore": {"type": "number"}}}'::jsonb,
    E'server.tool(\n  "analyze_text",\n  "Analyze text content",\n  {\n    text: z.string().min(1).max(50000),\n    analyses: z.array(z.enum(["word_count", "language", "keywords", "readability"])).optional(),\n  },\n  async ({ text, analyses }) => {\n    const results: Record<string, unknown> = {};\n    results.wordCount = text.split(/\\s+/).length;\n    results.charCount = text.length;\n    // Additional analyses...\n    return {\n      content: [{ type: "text", text: JSON.stringify(results, null, 2) }],\n    };\n  }\n);',
    '["input_validation", "size_limit"]'::jsonb,
    '["claude_code", "openai_codex", "opencode", "cursor", "kiro", "universal"]'::jsonb,
    '[]'::jsonb,
    TRUE,
    95
),
-- Skill 8: Git Operations
(
    'Git Operations',
    'git-operations',
    'Operaciones Git de solo lectura: status, log, diff, blame. No permite modificaciones al repositorio.',
    'source-control',
    '{"type": "object", "properties": {"operation": {"type": "string", "enum": ["status", "log", "diff", "blame", "branch"]}, "args": {"type": "array", "items": {"type": "string"}}}, "required": ["operation"]}'::jsonb,
    '{"type": "object", "properties": {"output": {"type": "string"}}}'::jsonb,
    E'const GIT_ALLOWED = ["status", "log", "diff", "blame", "branch", "show"];\n\nserver.tool(\n  "git",\n  "Execute read-only git operations",\n  {\n    operation: z.enum(["status", "log", "diff", "blame", "branch", "show"]),\n    args: z.array(z.string()).optional().default([]),\n  },\n  async ({ operation, args }) => {\n    const { stdout } = await execFile("git", [operation, ...args], {\n      cwd: PROJECT_ROOT,\n      timeout: 10000,\n    });\n    return {\n      content: [{ type: "text", text: stdout }],\n    };\n  }\n);',
    '["command_allowlist", "read_only", "timeout", "cwd_restriction"]'::jsonb,
    '["claude_code", "openai_codex", "opencode", "cursor", "kiro", "universal"]'::jsonb,
    '["child_process"]'::jsonb,
    TRUE,
    178
);

-- ============================================================
-- SECURITY RULES - Reglas de seguridad
-- ============================================================

INSERT INTO security_rules (name, description, category, severity, pattern, recommendation, is_active)
VALUES
(
    'No eval()',
    'Bloquear uso de eval() que permite ejecución arbitraria de código desde strings',
    'code_execution',
    'critical',
    'eval\s*\(',
    'Usar JSON.parse() para datos JSON, o funciones específicas con switch/case para lógica condicional',
    TRUE
),
(
    'No new Function()',
    'Bloquear constructor Function() que es equivalente a eval()',
    'code_execution',
    'critical',
    'new\s+Function\s*\(',
    'Reemplazar con funciones predefinidas, lookup tables, o strategy pattern',
    TRUE
),
(
    'No child_process sin restricción',
    'Detectar uso de child_process que permite ejecución de comandos del sistema operativo',
    'code_execution',
    'critical',
    'child_process|exec\s*\(|execSync|spawn\s*\(',
    'Usar execFile (no exec) con lista blanca de comandos permitidos y timeout obligatorio',
    TRUE
),
(
    'No secrets hardcodeados',
    'Detectar API keys, passwords, tokens y otros secrets embebidos en el código fuente',
    'information_exposure',
    'critical',
    '(password|secret|api_key|token|private_key)\s*[:=]\s*[''"][^''"]+[''"]',
    'Usar variables de entorno (process.env.SECRET_NAME) o un gestor de secrets (Vault, AWS Secrets Manager)',
    TRUE
),
(
    'No path traversal',
    'Detectar patrones ../ que pueden permitir acceso fuera del directorio permitido',
    'filesystem',
    'high',
    '\.\.\/',
    'Usar path.resolve() y validar que la ruta resuelta esté dentro del directorio raíz permitido',
    TRUE
),
(
    'No fs.write sin validación',
    'Detectar escrituras al filesystem que pueden modificar archivos del sistema',
    'filesystem',
    'high',
    'fs\.(write|unlink|rm|chmod|mkdir)',
    'Restringir a directorios específicos, validar path, verificar permisos, usar modo restrictivo',
    TRUE
),
(
    'No acceso a red sin control',
    'Detectar llamadas de red que pueden conectar a servicios maliciosos o exfiltrar datos',
    'network',
    'medium',
    'fetch\s*\(|axios|http\.request|https\.request',
    'Implementar allowlist de dominios, timeout obligatorio, y validar URLs antes de conectar',
    TRUE
),
(
    'No process.env sin filtro',
    'Detectar acceso genérico a variables de entorno que puede exponer secrets',
    'information_exposure',
    'medium',
    'process\.env(?!\[|\.NODE_ENV|\.PORT|\.HOME)',
    'Acceder solo a variables específicas conocidas, nunca iterar sobre todo process.env',
    TRUE
),
(
    'No innerHTML/outerHTML',
    'Detectar manipulación DOM insegura que es vector de XSS',
    'xss',
    'medium',
    'innerHTML|outerHTML|document\.write',
    'Usar textContent para texto plano, o bibliotecas de sanitización como DOMPurify',
    TRUE
),
(
    'No JSON.parse sin try-catch',
    'Detectar JSON.parse que puede lanzar excepciones con input malformado',
    'error_handling',
    'low',
    'JSON\.parse\s*\([^)]*\)(?!.*catch)',
    'Envolver en try-catch, validar el resultado con un schema Zod, manejar el error gracefully',
    TRUE
),
(
    'No console.log en producción',
    'Detectar logging que puede exponer información sensible en producción',
    'information_exposure',
    'info',
    'console\.(log|debug|info)',
    'Usar console.error para errores en MCP stdio. Remover debug logs o usar un logger configurable',
    TRUE
),
(
    'No TODO/FIXME en producción',
    'Detectar código marcado como incompleto que puede contener lógica faltante',
    'code_quality',
    'info',
    'TODO|FIXME|HACK|XXX',
    'Completar la implementación antes de publicar. Convertir TODOs en issues del proyecto',
    TRUE
);

-- ============================================================
-- MCP TEMPLATES - Plantillas base
-- ============================================================

INSERT INTO mcp_templates (name, description, category, platform, transport, base_code, config_template, required_dependencies, security_features, variables, usage_count)
VALUES
-- Template 1: Basic stdio
(
    'Basic stdio Server',
    'Servidor MCP mínimo con transporte stdio. Punto de partida para MCPs locales simples.',
    'basic',
    'universal',
    'stdio',
    E'#!/usr/bin/env node\nimport { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";\nimport { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";\nimport { z } from "zod";\n\nconst server = new McpServer({\n  name: "{{name}}",\n  version: "{{version}}",\n  capabilities: { tools: {} },\n});\n\n// Register your tools here\n// server.tool("tool_name", "description", { param: z.string() }, async ({ param }) => { ... });\n\nconst transport = new StdioServerTransport();\nawait server.connect(transport);\nconsole.error("{{name}} MCP server started on stdio");',
    '{"mcpServers": {"{{slug}}": {"command": "node", "args": ["./dist/index.js"]}}}'::jsonb,
    '["@modelcontextprotocol/sdk", "zod"]'::jsonb,
    '["input_validation", "error_handling"]'::jsonb,
    '[{"name": "name", "description": "Nombre del servidor MCP", "type": "string", "required": true}, {"name": "version", "description": "Versión del servidor", "type": "string", "required": false}, {"name": "slug", "description": "Identificador URL-safe", "type": "string", "required": true}]'::jsonb,
    342
),
-- Template 2: HTTP Server
(
    'HTTP Server with Security',
    'Servidor MCP con transporte HTTP, rate limiting, CORS, y validación completa. Listo para deploy en Vercel.',
    'advanced',
    'universal',
    'http',
    E'#!/usr/bin/env node\nimport { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";\nimport { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";\nimport express from "express";\nimport { z } from "zod";\n\nconst app = express();\napp.use(express.json({ limit: "{{maxRequestSize}}" }));\n\n// Rate limiting\nconst requests = new Map();\napp.use((req, res, next) => {\n  const ip = req.ip;\n  const now = Date.now();\n  const state = requests.get(ip);\n  if (state && now < state.reset && state.count >= {{rateLimit}}) {\n    return res.status(429).json({ error: "Rate limit exceeded" });\n  }\n  if (!state || now >= state.reset) requests.set(ip, { count: 1, reset: now + 60000 });\n  else state.count++;\n  next();\n});\n\n// CORS\napp.use((req, res, next) => {\n  res.header("Access-Control-Allow-Origin", "{{corsOrigin}}");\n  res.header("Access-Control-Allow-Methods", "POST, GET, OPTIONS");\n  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");\n  if (req.method === "OPTIONS") return res.sendStatus(200);\n  next();\n});\n\nconst server = new McpServer({\n  name: "{{name}}",\n  version: "{{version}}",\n  capabilities: { tools: {} },\n});\n\n// Register tools here\n\napp.post("/mcp", async (req, res) => {\n  const transport = new StreamableHTTPServerTransport("/mcp", res);\n  await server.connect(transport);\n  await transport.handleRequest(req, res);\n});\n\napp.get("/health", (_, res) => res.json({ status: "ok" }));\n\nconst PORT = process.env.PORT || {{port}};\napp.listen(PORT, () => console.log(`MCP server on port ${PORT}`));',
    '{"mcpServers": {"{{slug}}": {"type": "http", "url": "{{url}}/mcp"}}}'::jsonb,
    '["@modelcontextprotocol/sdk", "zod", "express"]'::jsonb,
    '["input_validation", "rate_limiting", "cors", "request_size_limit", "error_handling"]'::jsonb,
    '[{"name": "name", "description": "Nombre del servidor", "type": "string", "required": true}, {"name": "version", "description": "Versión", "type": "string", "required": false}, {"name": "slug", "description": "Identificador URL-safe", "type": "string", "required": true}, {"name": "port", "description": "Puerto HTTP", "type": "number", "required": false}, {"name": "rateLimit", "description": "Max requests por minuto", "type": "number", "required": false}, {"name": "corsOrigin", "description": "Origen CORS permitido", "type": "string", "required": false}, {"name": "maxRequestSize", "description": "Tamaño máximo de request", "type": "string", "required": false}, {"name": "url", "description": "URL pública del servidor", "type": "string", "required": false}]'::jsonb,
    218
),
-- Template 3: Multi-tool with Resources
(
    'Multi-tool Server with Resources',
    'Servidor MCP con múltiples herramientas y recursos expuestos. Incluye patrón de registro dinámico.',
    'intermediate',
    'universal',
    'stdio',
    E'#!/usr/bin/env node\nimport { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";\nimport { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";\nimport { z } from "zod";\n\nconst server = new McpServer({\n  name: "{{name}}",\n  version: "{{version}}",\n  capabilities: {\n    tools: {},\n    resources: {},\n  },\n});\n\n// Resources - datos estáticos o dinámicos que el AI puede leer\nserver.resource("config", "application/json", async () => ({\n  contents: [{\n    uri: "config://app",\n    text: JSON.stringify({ name: "{{name}}", version: "{{version}}" }),\n    mimeType: "application/json",\n  }],\n}));\n\n// Tools - funciones que el AI puede invocar\n// Tool 1\nserver.tool("{{tool1_name}}", "{{tool1_description}}", {\n  input: z.string().describe("Input parameter"),\n}, async ({ input }) => {\n  return { content: [{ type: "text", text: `Processed: ${input}` }] };\n});\n\n// Tool 2\nserver.tool("{{tool2_name}}", "{{tool2_description}}", {\n  query: z.string().describe("Search query"),\n  limit: z.number().optional().default(10),\n}, async ({ query, limit }) => {\n  return { content: [{ type: "text", text: `Results for: ${query} (limit: ${limit})` }] };\n});\n\nconst transport = new StdioServerTransport();\nawait server.connect(transport);',
    '{"mcpServers": {"{{slug}}": {"command": "node", "args": ["./dist/index.js"]}}}'::jsonb,
    '["@modelcontextprotocol/sdk", "zod"]'::jsonb,
    '["input_validation", "error_handling", "resource_access_control"]'::jsonb,
    '[{"name": "name", "description": "Nombre del servidor", "type": "string", "required": true}, {"name": "version", "description": "Versión", "type": "string", "required": false}, {"name": "slug", "description": "Identificador", "type": "string", "required": true}, {"name": "tool1_name", "description": "Nombre de la primera herramienta", "type": "string", "required": true}, {"name": "tool1_description", "description": "Descripción de la primera herramienta", "type": "string", "required": true}, {"name": "tool2_name", "description": "Nombre de la segunda herramienta", "type": "string", "required": true}, {"name": "tool2_description", "description": "Descripción de la segunda herramienta", "type": "string", "required": true}]'::jsonb,
    156
);

-- ============================================================
-- VERIFICACIÓN DE SEED
-- ============================================================

DO $$
DECLARE
    kb_count INTEGER;
    skills_count INTEGER;
    rules_count INTEGER;
    templates_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO kb_count FROM knowledge_base;
    SELECT COUNT(*) INTO skills_count FROM skills;
    SELECT COUNT(*) INTO rules_count FROM security_rules;
    SELECT COUNT(*) INTO templates_count FROM mcp_templates;

    RAISE NOTICE '✅ Seed completado exitosamente:';
    RAISE NOTICE '   - Knowledge Base: % entradas', kb_count;
    RAISE NOTICE '   - Skills: % herramientas', skills_count;
    RAISE NOTICE '   - Security Rules: % reglas', rules_count;
    RAISE NOTICE '   - Templates: % plantillas', templates_count;
END $$;
