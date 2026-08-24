-- ============================================================
-- MCP Builder - Script de Base de Datos
-- Compatible con: Neon PostgreSQL / PostgreSQL 14+
-- ============================================================
-- Ejecutar en Neon SQL Editor o con psql:
--   psql $DATABASE_URL -f database/001_schema.sql
-- ============================================================

-- Limpiar si existe (solo para desarrollo)
-- DROP SCHEMA IF EXISTS public CASCADE;
-- CREATE SCHEMA public;

-- ============================================================
-- EXTENSIONES
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";      -- Para uuid_generate_v4()
CREATE EXTENSION IF NOT EXISTS "pg_trgm";        -- Para búsqueda por similitud de texto

-- ============================================================
-- ENUMS
-- ============================================================

DO $$ BEGIN
    CREATE TYPE mcp_status AS ENUM ('draft', 'generating', 'completed', 'error');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE platform AS ENUM (
        'claude_code',
        'openai_codex',
        'opencode',
        'antigravity',
        'cursor',
        'kiro',
        'universal'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE mode AS ENUM ('orchestrator', 'tutor');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE transport AS ENUM ('stdio', 'http', 'sse');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE security_level AS ENUM ('strict', 'standard', 'permissive');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- TABLA: mcp_projects
-- Proyectos MCP creados por los usuarios
-- ============================================================

CREATE TABLE IF NOT EXISTS mcp_projects (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                VARCHAR(255) NOT NULL,
    description         TEXT,
    objective           TEXT NOT NULL,
    mode                mode NOT NULL DEFAULT 'orchestrator',
    status              mcp_status NOT NULL DEFAULT 'draft',
    target_platforms    JSONB DEFAULT '[]'::jsonb,
    transport           transport NOT NULL DEFAULT 'stdio',
    security_level      security_level NOT NULL DEFAULT 'standard',
    generated_code      TEXT,
    generated_config    JSONB,
    tutor_documentation TEXT,
    mermaid_diagrams    JSONB,
    metadata            JSONB,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_mcp_projects_status ON mcp_projects(status);
CREATE INDEX IF NOT EXISTS idx_mcp_projects_mode ON mcp_projects(mode);
CREATE INDEX IF NOT EXISTS idx_mcp_projects_created_at ON mcp_projects(created_at DESC);

-- ============================================================
-- TABLA: skills
-- Herramientas/capacidades que un MCP puede exponer
-- ============================================================

CREATE TABLE IF NOT EXISTS skills (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                    VARCHAR(255) NOT NULL,
    slug                    VARCHAR(255) NOT NULL UNIQUE,
    description             TEXT NOT NULL,
    category                VARCHAR(100) NOT NULL,
    input_schema            JSONB,
    output_schema           JSONB,
    code_template           TEXT NOT NULL,
    security_requirements   JSONB,
    compatible_platforms    JSONB,
    dependencies            JSONB,
    is_builtin              BOOLEAN DEFAULT FALSE,
    usage_count             INTEGER DEFAULT 0,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_skills_category ON skills(category);
CREATE INDEX IF NOT EXISTS idx_skills_slug ON skills(slug);
CREATE INDEX IF NOT EXISTS idx_skills_is_builtin ON skills(is_builtin);
CREATE INDEX IF NOT EXISTS idx_skills_name_trgm ON skills USING GIN (name gin_trgm_ops);

-- ============================================================
-- TABLA: knowledge_base
-- MCPs conocidos, patrones y mejores prácticas
-- ============================================================

CREATE TABLE IF NOT EXISTS knowledge_base (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title           VARCHAR(255) NOT NULL,
    description     TEXT NOT NULL,
    category        VARCHAR(100) NOT NULL,
    tags            JSONB DEFAULT '[]'::jsonb,
    source_url      VARCHAR(500),
    content         TEXT NOT NULL,
    code_examples   JSONB,
    related_skills  JSONB,
    platform        VARCHAR(100),
    difficulty      VARCHAR(20) DEFAULT 'intermediate',
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Índices para búsqueda
CREATE INDEX IF NOT EXISTS idx_knowledge_base_category ON knowledge_base(category);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_platform ON knowledge_base(platform);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_difficulty ON knowledge_base(difficulty);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_tags ON knowledge_base USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_title_trgm ON knowledge_base USING GIN (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_content_trgm ON knowledge_base USING GIN (content gin_trgm_ops);

-- ============================================================
-- TABLA: mcp_templates
-- Plantillas reutilizables para generación de MCPs
-- ============================================================

CREATE TABLE IF NOT EXISTS mcp_templates (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                    VARCHAR(255) NOT NULL,
    description             TEXT NOT NULL,
    category                VARCHAR(100) NOT NULL,
    platform                platform NOT NULL DEFAULT 'universal',
    transport               transport NOT NULL DEFAULT 'stdio',
    base_code               TEXT NOT NULL,
    config_template         JSONB,
    required_dependencies   JSONB,
    security_features       JSONB,
    variables               JSONB,
    usage_count             INTEGER DEFAULT 0,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_mcp_templates_category ON mcp_templates(category);
CREATE INDEX IF NOT EXISTS idx_mcp_templates_platform ON mcp_templates(platform);
CREATE INDEX IF NOT EXISTS idx_mcp_templates_transport ON mcp_templates(transport);

-- ============================================================
-- TABLA: security_rules
-- Reglas de seguridad aplicadas a MCPs generados
-- ============================================================

CREATE TABLE IF NOT EXISTS security_rules (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(255) NOT NULL,
    description     TEXT NOT NULL,
    category        VARCHAR(100) NOT NULL,
    severity        VARCHAR(20) NOT NULL,
    pattern         TEXT NOT NULL,
    recommendation  TEXT NOT NULL,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_security_rules_category ON security_rules(category);
CREATE INDEX IF NOT EXISTS idx_security_rules_severity ON security_rules(severity);
CREATE INDEX IF NOT EXISTS idx_security_rules_is_active ON security_rules(is_active);

-- ============================================================
-- TABLA: user_sessions
-- Estado de la conversación/flujo de consulta
-- ============================================================

CREATE TABLE IF NOT EXISTS user_sessions (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id              UUID REFERENCES mcp_projects(id) ON DELETE SET NULL,
    mode                    mode NOT NULL,
    current_step            INTEGER DEFAULT 0,
    conversation_history    JSONB,
    user_preferences        JSONB,
    selected_skills         JSONB,
    material_uploaded       JSONB,
    is_completed            BOOLEAN DEFAULT FALSE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_user_sessions_project_id ON user_sessions(project_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_mode ON user_sessions(mode);
CREATE INDEX IF NOT EXISTS idx_user_sessions_is_completed ON user_sessions(is_completed);
CREATE INDEX IF NOT EXISTS idx_user_sessions_created_at ON user_sessions(created_at DESC);

-- ============================================================
-- TABLA: generated_outputs
-- Código y documentación generados por proyecto
-- ============================================================

CREATE TABLE IF NOT EXISTS generated_outputs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id      UUID NOT NULL REFERENCES mcp_projects(id) ON DELETE CASCADE,
    output_type     VARCHAR(50) NOT NULL,
    filename        VARCHAR(255) NOT NULL,
    content         TEXT NOT NULL,
    language        VARCHAR(50),
    metadata        JSONB,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_generated_outputs_project_id ON generated_outputs(project_id);
CREATE INDEX IF NOT EXISTS idx_generated_outputs_output_type ON generated_outputs(output_type);

-- ============================================================
-- FUNCIONES AUXILIARES
-- ============================================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
DROP TRIGGER IF EXISTS trigger_mcp_projects_updated_at ON mcp_projects;
CREATE TRIGGER trigger_mcp_projects_updated_at
    BEFORE UPDATE ON mcp_projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_user_sessions_updated_at ON user_sessions;
CREATE TRIGGER trigger_user_sessions_updated_at
    BEFORE UPDATE ON user_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- FUNCIÓN: Búsqueda en Knowledge Base
-- Usa pg_trgm para búsqueda por similitud
-- ============================================================

CREATE OR REPLACE FUNCTION search_knowledge(
    search_query TEXT,
    result_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
    id UUID,
    title VARCHAR(255),
    description TEXT,
    category VARCHAR(100),
    tags JSONB,
    platform VARCHAR(100),
    relevance_score REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        kb.id,
        kb.title,
        kb.description,
        kb.category,
        kb.tags,
        kb.platform,
        (
            similarity(kb.title, search_query) * 0.4 +
            similarity(kb.description, search_query) * 0.3 +
            similarity(kb.content, search_query) * 0.3
        )::REAL AS relevance_score
    FROM knowledge_base kb
    WHERE
        kb.title % search_query
        OR kb.description % search_query
        OR kb.content % search_query
        OR kb.tags::text ILIKE '%' || search_query || '%'
    ORDER BY relevance_score DESC
    LIMIT result_limit;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- FUNCIÓN: Estadísticas del sistema
-- ============================================================

CREATE OR REPLACE FUNCTION get_system_stats()
RETURNS TABLE (
    total_projects BIGINT,
    completed_projects BIGINT,
    total_skills BIGINT,
    total_knowledge_entries BIGINT,
    total_templates BIGINT,
    active_security_rules BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        (SELECT COUNT(*) FROM mcp_projects),
        (SELECT COUNT(*) FROM mcp_projects WHERE status = 'completed'),
        (SELECT COUNT(*) FROM skills),
        (SELECT COUNT(*) FROM knowledge_base),
        (SELECT COUNT(*) FROM mcp_templates),
        (SELECT COUNT(*) FROM security_rules WHERE is_active = TRUE);
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- VISTAS
-- ============================================================

-- Vista: Proyectos recientes con resumen
CREATE OR REPLACE VIEW recent_projects AS
SELECT
    p.id,
    p.name,
    p.objective,
    p.mode,
    p.status,
    p.security_level,
    p.transport,
    p.target_platforms,
    p.created_at,
    (SELECT COUNT(*) FROM generated_outputs o WHERE o.project_id = p.id) AS files_generated
FROM mcp_projects p
ORDER BY p.created_at DESC
LIMIT 50;

-- Vista: Skills más usados
CREATE OR REPLACE VIEW popular_skills AS
SELECT
    s.id,
    s.name,
    s.slug,
    s.category,
    s.description,
    s.usage_count,
    s.is_builtin
FROM skills s
ORDER BY s.usage_count DESC;

-- ============================================================
-- PERMISOS (ajustar según tu usuario de Neon)
-- ============================================================

-- En Neon, el usuario por defecto tiene todos los permisos necesarios.
-- Si necesitas un usuario de solo lectura para reporting:
-- CREATE ROLE mcp_readonly;
-- GRANT SELECT ON ALL TABLES IN SCHEMA public TO mcp_readonly;

-- ============================================================
-- VERIFICACIÓN
-- ============================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Schema creado exitosamente';
    RAISE NOTICE '   - Tablas: mcp_projects, skills, knowledge_base, mcp_templates, security_rules, user_sessions, generated_outputs';
    RAISE NOTICE '   - Funciones: search_knowledge(), get_system_stats(), update_updated_at_column()';
    RAISE NOTICE '   - Vistas: recent_projects, popular_skills';
    RAISE NOTICE '   - Extensiones: uuid-ossp, pg_trgm';
END $$;
