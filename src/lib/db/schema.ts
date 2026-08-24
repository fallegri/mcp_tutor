import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  jsonb,
  integer,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";

// Enums
export const mcpStatusEnum = pgEnum("mcp_status", [
  "draft",
  "generating",
  "completed",
  "error",
]);

export const platformEnum = pgEnum("platform", [
  "claude_code",
  "openai_codex",
  "opencode",
  "antigravity",
  "cursor",
  "kiro",
  "universal",
]);

export const modeEnum = pgEnum("mode", ["orchestrator", "tutor"]);

export const transportEnum = pgEnum("transport", ["stdio", "http", "sse"]);

export const securityLevelEnum = pgEnum("security_level", [
  "strict",
  "standard",
  "permissive",
]);

// ============ TABLES ============

/**
 * Proyectos MCP - Cada proyecto generado por un usuario
 */
export const mcpProjects = pgTable("mcp_projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  objective: text("objective").notNull(),
  mode: modeEnum("mode").notNull().default("orchestrator"),
  status: mcpStatusEnum("status").notNull().default("draft"),
  targetPlatforms: jsonb("target_platforms").$type<string[]>().default([]),
  transport: transportEnum("transport").notNull().default("stdio"),
  securityLevel: securityLevelEnum("security_level")
    .notNull()
    .default("standard"),
  generatedCode: text("generated_code"),
  generatedConfig: jsonb("generated_config"),
  tutorDocumentation: text("tutor_documentation"),
  mermaidDiagrams: jsonb("mermaid_diagrams").$type<string[]>(),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * Skills - Herramientas/capacidades que un MCP puede exponer
 */
export const skills = pgTable("skills", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description").notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  inputSchema: jsonb("input_schema").$type<Record<string, unknown>>(),
  outputSchema: jsonb("output_schema").$type<Record<string, unknown>>(),
  codeTemplate: text("code_template").notNull(),
  securityRequirements: jsonb("security_requirements").$type<string[]>(),
  compatiblePlatforms: jsonb("compatible_platforms").$type<string[]>(),
  dependencies: jsonb("dependencies").$type<string[]>(),
  isBuiltin: boolean("is_builtin").default(false),
  usageCount: integer("usage_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Base de Conocimiento - MCPs conocidos y patrones
 */
export const knowledgeBase = pgTable("knowledge_base", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  tags: jsonb("tags").$type<string[]>().default([]),
  sourceUrl: varchar("source_url", { length: 500 }),
  content: text("content").notNull(),
  codeExamples: jsonb("code_examples").$type<Record<string, string>>(),
  relatedSkills: jsonb("related_skills").$type<string[]>(),
  platform: varchar("platform", { length: 100 }),
  difficulty: varchar("difficulty", { length: 20 }).default("intermediate"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Templates MCP - Plantillas reutilizables
 */
export const mcpTemplates = pgTable("mcp_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description").notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  platform: platformEnum("platform").notNull().default("universal"),
  transport: transportEnum("transport").notNull().default("stdio"),
  baseCode: text("base_code").notNull(),
  configTemplate: jsonb("config_template"),
  requiredDependencies: jsonb("required_dependencies").$type<string[]>(),
  securityFeatures: jsonb("security_features").$type<string[]>(),
  variables: jsonb("variables").$type<
    Array<{ name: string; description: string; type: string; required: boolean }>
  >(),
  usageCount: integer("usage_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Reglas de Seguridad - Validaciones aplicadas a MCPs generados
 */
export const securityRules = pgTable("security_rules", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description").notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  severity: varchar("severity", { length: 20 }).notNull(),
  pattern: text("pattern").notNull(),
  recommendation: text("recommendation").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Sesiones de Usuario - Estado de la conversación/flujo
 */
export const userSessions = pgTable("user_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").references(() => mcpProjects.id),
  mode: modeEnum("mode").notNull(),
  currentStep: integer("current_step").default(0),
  conversationHistory: jsonb("conversation_history").$type<
    Array<{ role: string; content: string; timestamp: string }>
  >(),
  userPreferences: jsonb("user_preferences").$type<Record<string, unknown>>(),
  selectedSkills: jsonb("selected_skills").$type<string[]>(),
  materialUploaded: jsonb("material_uploaded").$type<
    Array<{ name: string; type: string; content: string }>
  >(),
  isCompleted: boolean("is_completed").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * Outputs Generados - Código y documentación producidos
 */
export const generatedOutputs = pgTable("generated_outputs", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .references(() => mcpProjects.id)
    .notNull(),
  outputType: varchar("output_type", { length: 50 }).notNull(),
  filename: varchar("filename", { length: 255 }).notNull(),
  content: text("content").notNull(),
  language: varchar("language", { length: 50 }),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Type exports
export type McpProject = typeof mcpProjects.$inferSelect;
export type NewMcpProject = typeof mcpProjects.$inferInsert;
export type Skill = typeof skills.$inferSelect;
export type NewSkill = typeof skills.$inferInsert;
export type KnowledgeEntry = typeof knowledgeBase.$inferSelect;
export type McpTemplate = typeof mcpTemplates.$inferSelect;
export type SecurityRule = typeof securityRules.$inferSelect;
export type UserSession = typeof userSessions.$inferSelect;
export type GeneratedOutput = typeof generatedOutputs.$inferSelect;
