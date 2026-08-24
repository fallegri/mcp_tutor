# 🚀 Guía de Despliegue - MCP Builder

## Opción 1: Vercel + Neon (Producción)

### Pre-requisitos
- Cuenta en [Vercel](https://vercel.com)
- Cuenta en [Neon](https://neon.tech) (tiene tier gratuito)
- Node.js 18+ instalado localmente

### Paso 1: Configurar Neon

1. Ir a [console.neon.tech](https://console.neon.tech)
2. Crear nuevo proyecto: `mcp-builder`
3. Copiar el connection string:
   ```
   postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/mcp_builder?sslmode=require
   ```

### Paso 2: Desplegar en Vercel

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Desplegar
vercel deploy

# Configurar variable de entorno
vercel env add DATABASE_URL production
# Pegar el connection string de Neon
```

### Paso 3: Ejecutar Migraciones

```bash
# Generar schema SQL
npm run db:generate

# Aplicar a Neon
DATABASE_URL="tu-connection-string" npm run db:push

# Sembrar datos iniciales
DATABASE_URL="tu-connection-string" npm run db:seed
```

### Paso 4: Verificar

- Abrir la URL de Vercel
- Probar generación de un MCP
- Verificar que la base de conocimiento funciona

---

## Opción 2: Docker (Auto-hospedado)

### Pre-requisitos
- Docker y Docker Compose instalados

### Despliegue

```bash
# Clonar repositorio
git clone <repo-url>
cd mcp-builder

# Levantar servicios
docker-compose up -d

# Verificar que todo funciona
docker-compose ps
docker-compose logs app
```

Acceder a: http://localhost:3000

### Personalización

Editar `docker-compose.yml` para:
- Cambiar puertos
- Agregar volúmenes persistentes
- Configurar variables de entorno adicionales

---

## Opción 3: Desarrollo Local

```bash
# Instalar dependencias
npm install

# Copiar y configurar variables
cp .env.example .env
# Editar .env con tu DATABASE_URL

# Ejecutar en modo desarrollo
npm run dev
```

> **Nota:** Sin DATABASE_URL, la app funciona con la base de conocimiento en memoria.
> Para persistencia completa, configura una base de datos PostgreSQL.

---

## Variables de Entorno

| Variable | Requerida | Descripción |
|----------|-----------|-------------|
| `DATABASE_URL` | Sí* | Connection string PostgreSQL (Neon) |
| `NEXT_PUBLIC_APP_URL` | No | URL pública de la app |
| `NODE_ENV` | No | development / production |
| `ENCRYPTION_KEY` | No | Para cifrado de datos sensibles |
| `RATE_LIMIT_MAX` | No | Máximo requests por ventana (default: 100) |

*La app funciona sin DB usando datos en memoria, pero sin persistencia.

---

## Integración Vercel + Neon (Marketplace)

La forma más sencilla:

1. En Vercel Dashboard → Storage → Browse Marketplace
2. Seleccionar "Neon"
3. Crear base de datos
4. Las variables se configuran automáticamente

Esto configura automáticamente `DATABASE_URL` y habilita connection pooling.

---

## Monitoreo

### Vercel
- Analytics automáticos
- Function logs en Dashboard → Functions
- Error tracking integrado

### Neon
- Query performance en Dashboard
- Connection pooling stats
- Database branching para staging

---

## Troubleshooting

### Error: "Invalid DATABASE_URL"
- Verificar que el string incluye `?sslmode=require`
- Verificar que el endpoint está activo en Neon

### Error: "Connection timeout"
- Neon suspende bases inactivas (se reactivan en ~500ms)
- Agregar retry logic o usar `@neondatabase/serverless`

### Error: "Rate limit exceeded"
- Default: 10 requests/minuto para generación
- Ajustar `RATE_LIMIT_MAX` si necesitas más
