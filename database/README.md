# 🗄️ Base de Datos - MCP Builder

## Scripts SQL

| Archivo | Descripción | Orden |
|---------|-------------|-------|
| `001_schema.sql` | Estructura completa (tablas, índices, funciones, vistas, triggers) | 1️⃣ Primero |
| `002_seed_data.sql` | Datos iniciales (knowledge base, skills, rules, templates) | 2️⃣ Segundo |

---

## 🚀 Ejecución

### Opción A: Neon SQL Editor (Más fácil)

1. Ir a [console.neon.tech](https://console.neon.tech)
2. Seleccionar tu proyecto → **SQL Editor**
3. Copiar y pegar `001_schema.sql` → **Run**
4. Copiar y pegar `002_seed_data.sql` → **Run**

### Opción B: psql (Terminal)

```bash
# Con tu connection string de Neon:
export DATABASE_URL="postgresql://user:pass@ep-xxx.neon.tech/mcp_builder?sslmode=require"

# Ejecutar schema
psql $DATABASE_URL -f database/001_schema.sql

# Ejecutar seed
psql $DATABASE_URL -f database/002_seed_data.sql
```

### Opción C: Docker local

```bash
# Levantar PostgreSQL local
docker-compose up postgres -d

# Esperar a que esté listo
sleep 3

# Ejecutar scripts
docker exec -i mcp-builder-postgres-1 psql -U mcp_user -d mcp_builder < database/001_schema.sql
docker exec -i mcp-builder-postgres-1 psql -U mcp_user -d mcp_builder < database/002_seed_data.sql
```

### Opción D: Drizzle (desde Node.js)

```bash
# Genera migraciones desde el schema TypeScript
npm run db:push

# Ejecuta el seed con TypeScript
npm run db:seed
```

---

## 📊 Estructura de la Base de Datos

```
┌─────────────────────┐     ┌──────────────────────┐
│    mcp_projects     │     │    user_sessions     │
├─────────────────────┤     ├──────────────────────┤
│ id (PK, UUID)       │◄────│ project_id (FK)      │
│ name                │     │ mode                 │
│ objective           │     │ current_step         │
│ mode                │     │ conversation_history │
│ status              │     │ selected_skills      │
│ target_platforms    │     │ is_completed         │
│ transport           │     └──────────────────────┘
│ security_level      │
│ generated_code      │     ┌──────────────────────┐
│ generated_config    │     │  generated_outputs   │
│ tutor_documentation │     ├──────────────────────┤
└─────────────────────┘     │ project_id (FK)      │
                            │ output_type          │
┌─────────────────────┐     │ filename             │
│       skills        │     │ content              │
├─────────────────────┤     │ language             │
│ id (PK, UUID)       │     └──────────────────────┘
│ name                │
│ slug (UNIQUE)       │     ┌──────────────────────┐
│ category            │     │   knowledge_base     │
│ code_template       │     ├──────────────────────┤
│ security_req        │     │ title                │
│ compatible_platforms│     │ description          │
│ usage_count         │     │ category             │
└─────────────────────┘     │ tags (JSONB)         │
                            │ content              │
┌─────────────────────┐     │ platform             │
│   mcp_templates     │     └──────────────────────┘
├─────────────────────┤
│ name                │     ┌──────────────────────┐
│ platform            │     │   security_rules     │
│ transport           │     ├──────────────────────┤
│ base_code           │     │ name                 │
│ variables           │     │ severity             │
│ security_features   │     │ pattern (regex)      │
└─────────────────────┘     │ recommendation       │
                            │ is_active            │
                            └──────────────────────┘
```

---

## 🔍 Funciones Disponibles

### `search_knowledge(query TEXT, limit INTEGER)`
Búsqueda por similitud en la knowledge base usando pg_trgm.

```sql
SELECT * FROM search_knowledge('github pull requests', 5);
```

### `get_system_stats()`
Estadísticas generales del sistema.

```sql
SELECT * FROM get_system_stats();
```

---

## 📋 Vistas

### `recent_projects`
Últimos 50 proyectos con conteo de archivos generados.

### `popular_skills`
Skills ordenados por uso (más populares primero).

---

## 🔒 Seguridad de la Base de Datos

- ✅ UUID para todos los IDs (no secuenciales)
- ✅ Constraints NOT NULL donde corresponde
- ✅ Foreign keys con ON DELETE apropiado
- ✅ Índices GIN para búsqueda JSONB
- ✅ pg_trgm para búsqueda fuzzy
- ✅ Connection via SSL obligatorio (Neon)
- ✅ Queries parametrizadas (via Drizzle ORM)

---

## 📈 Datos Iniciales (Seed)

| Tabla | Registros | Contenido |
|-------|-----------|-----------|
| `knowledge_base` | 10 | GitHub, PostgreSQL, Filesystem, Brave Search, Slack, Docker, Puppeteer, Memory, Sentry, Linear |
| `skills` | 8 | File Reader, Web Fetcher, DB Query, JSON Transform, Shell Command, API Caller, Text Analyzer, Git Ops |
| `security_rules` | 12 | eval, Function, child_process, secrets, path traversal, fs.write, fetch, process.env, innerHTML, JSON.parse, console.log, TODO |
| `mcp_templates` | 3 | Basic stdio, HTTP with Security, Multi-tool with Resources |
