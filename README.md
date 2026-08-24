# 🔌 MCP Builder

**Crea servidores MCP para Claude Code, OpenAI Codex, OpenCode, Antigravity, Cursor, Kiro y más.**

[![MCP Spec](https://img.shields.io/badge/MCP-2025--06--18-purple)](https://modelcontextprotocol.io)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-black)](https://vercel.com)
[![Neon](https://img.shields.io/badge/DB-Neon-green)](https://neon.tech)

---

## 📋 ¿Qué es MCP Builder?

MCP Builder es una aplicación que asiste a usuarios en la creación de servidores **MCP (Model Context Protocol)** compatibles con múltiples plataformas de IA. Funciona en dos modos:

### 🎯 Modo Orquestador
Genera MCPs completos automáticamente:
1. Consulta tu objetivo
2. Busca MCPs similares en la base de conocimiento
3. Te permite agregar skills y material teórico
4. Genera código seguro con validación
5. Produce configuración para cada plataforma

### 📚 Modo Tutor
Enseña paso a paso con documentación visual:
1. Diagramas Mermaid (compatibles Google Docs/Word)
2. Explicaciones técnicas y no técnicas
3. Documentación MD exportable
4. Glosario de términos
5. Ejercicios prácticos

---

## 🚀 Despliegue

### Opción 1: Vercel + Neon (Recomendada para producción)

```bash
# 1. Crear proyecto en Neon (neon.tech)
#    - Crear base de datos "mcp_builder"
#    - Copiar connection string

# 2. Desplegar en Vercel
vercel deploy

# 3. Configurar variable de entorno en Vercel
vercel env add DATABASE_URL
# Pegar: postgresql://user:pass@ep-xxx.neon.tech/mcp_builder?sslmode=require

# 4. Ejecutar migraciones
npm run db:push

# 5. Sembrar datos iniciales
npm run db:seed
```

### Opción 2: Local con Docker

```bash
# Levanta PostgreSQL + App
docker-compose up -d

# O solo la base de datos
docker-compose up postgres -d
npm run dev
```

### Opción 3: Local sin Docker

```bash
# Instalar dependencias
npm install

# Configurar .env
cp .env.example .env
# Editar DATABASE_URL con tu PostgreSQL

# Ejecutar en desarrollo
npm run dev
```

---

## 🏗️ Arquitectura

```mermaid
graph TB
    subgraph Frontend
        UI[Next.js App Router]
        Chat[Chat Interactivo]
        Preview[Vista Previa]
    end

    subgraph Backend
        API[API Routes]
        Generator[Motor de Generación]
        Security[Módulo Seguridad]
        Knowledge[Base de Conocimiento]
    end

    subgraph Database
        Neon[(Neon PostgreSQL)]
    end

    UI --> API
    API --> Generator
    API --> Security
    API --> Knowledge
    Knowledge --> Neon
```

---

## 📁 Estructura del Proyecto

```
mcp-builder/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx            # Página principal
│   │   └── api/                # API Routes
│   │       ├── generate/       # Endpoint de generación
│   │       └── knowledge/      # Búsqueda de conocimiento
│   ├── components/             # Componentes React
│   │   ├── builder/            # Modo Orquestador
│   │   ├── tutor/              # Modo Tutor
│   │   └── layout/             # Layout compartido
│   ├── lib/                    # Lógica de negocio
│   │   ├── mcp/                # Motor MCP
│   │   │   ├── generator.ts    # Generador de código
│   │   │   ├── platforms/      # Adaptadores de plataforma
│   │   │   └── templates/      # Templates base
│   │   ├── security/           # Escáner de seguridad
│   │   ├── tutor/              # Motor tutorial
│   │   │   ├── diagrams.ts     # Generador Mermaid
│   │   │   └── docs.ts         # Generador documentación
│   │   ├── knowledge/          # Búsqueda semántica
│   │   ├── consultation/       # Flujo de consulta
│   │   └── db/                 # Base de datos
│   └── types/                  # TypeScript types
├── docs/                       # Documentación
├── vercel.json                 # Configuración Vercel
├── docker-compose.yml          # Para desarrollo local
└── drizzle.config.ts           # Configuración ORM
```

---

## 🛡️ Seguridad

MCP Builder prioriza la seguridad en todos los aspectos:

### En la aplicación:
- ✅ Validación de inputs con Zod
- ✅ Rate limiting por IP
- ✅ Headers de seguridad (HSTS, CSP, etc.)
- ✅ Sin hardcoded secrets

### En los MCPs generados:
- ✅ Input sanitization automático
- ✅ Rate limiting configurable
- ✅ Path traversal prevention
- ✅ Output sanitization (redacción de secrets)
- ✅ Schema validation con Zod
- ✅ Security scanner post-generación
- ✅ 3 niveles: Strict / Standard / Permissive

### Escáner de Seguridad
El código generado pasa por un scanner que detecta:
| ID | Severidad | Detección |
|----|-----------|-----------|
| SEC-001 | Crítico | eval() |
| SEC-002 | Crítico | new Function() |
| SEC-003 | Crítico | child_process |
| SEC-004 | Alto | Escritura filesystem |
| SEC-005 | Alto | Path traversal |
| SEC-006 | Medio | Acceso a red |
| SEC-007 | Medio | Variables de entorno |
| SEC-008 | Crítico | Secrets hardcodeados |

---

## 🔌 Plataformas Soportadas

| Plataforma | Configuración | Transporte |
|-----------|---------------|-----------|
| Claude Code | `~/.claude/settings.json` | stdio, HTTP |
| OpenAI Codex | `~/.codex/config.json` | stdio, HTTP |
| OpenCode | `opencode.json` | stdio |
| Antigravity | Settings UI | stdio |
| Cursor | `.cursor/mcp.json` | stdio |
| Kiro | `.kiro/settings/mcp.json` | stdio |

---

## 📊 Diagramas Mermaid

El Modo Tutor genera diagramas compatibles con Google Docs y Word:

- **Arquitectura General** - Vista de alto nivel
- **Flujo de Datos** - Cómo viaja la información
- **Flujo de Seguridad** - Validaciones paso a paso
- **Mapa de Herramientas** - Tools disponibles
- **Diagrama de Despliegue** - Local vs Nube
- **Secuencia de Interacción** - Orden temporal

Para usarlos en documentos:
1. Copia el código Mermaid
2. Pégalo en [mermaid.live](https://mermaid.live)
3. Exporta como PNG/SVG
4. Inserta la imagen en tu documento

---

## ⚙️ Stack Tecnológico

| Componente | Tecnología | Propósito |
|-----------|-----------|-----------|
| Frontend | Next.js 14 | SSR, App Router |
| Estilos | Tailwind CSS | UI responsive |
| Database | Neon PostgreSQL | Serverless DB |
| ORM | Drizzle | Type-safe queries |
| MCP SDK | @modelcontextprotocol/sdk | Generación MCP |
| Validación | Zod | Schema validation |
| Diagramas | Mermaid.js | Visualizaciones |
| Deploy | Vercel | Hosting serverless |

---

## 🧑‍💻 Desarrollo

```bash
# Instalar
npm install

# Desarrollo
npm run dev

# Type checking
npm run type-check

# Generar migraciones
npm run db:generate

# Aplicar migraciones
npm run db:push

# Sembrar datos
npm run db:seed
```

---

## 📄 Licencia

MIT

---

## 🔗 Recursos

- [Especificación MCP](https://modelcontextprotocol.io/specification/2025-06-18)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [Neon PostgreSQL](https://neon.tech/docs)
- [Drizzle ORM](https://orm.drizzle.team)
- [Vercel Docs](https://vercel.com/docs)

---

*Construido con ❤️ para la comunidad de desarrolladores AI*
