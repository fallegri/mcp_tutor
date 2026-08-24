# 🛡️ Guía de Seguridad - MCP Builder

## Filosofía de Seguridad

MCP Builder aplica el principio de **"Seguridad por defecto"**. Todo código generado 
pasa por un scanner de seguridad antes de entregarse al usuario.

## Niveles de Seguridad

### 🔒 Strict (Estricto)
- Input máximo: 500 caracteres
- Rate limit: 10 requests/minuto
- Sin acceso a filesystem
- Sin acceso a red
- Sin ejecución de procesos
- CORS: solo orígenes específicos
- Ideal para: producción con datos sensibles

### 🛡️ Standard (Estándar)
- Input máximo: 2,000 caracteres
- Rate limit: 50 requests/minuto
- Filesystem: solo lectura en paths permitidos
- Red: solo dominios allowlisted
- Sin ejecución de procesos
- CORS: configurado
- Ideal para: uso general

### ⚡ Permissive (Permisivo)
- Input máximo: 5,000 caracteres
- Rate limit: 100 requests/minuto
- Filesystem: dentro del proyecto
- Red: abierta
- Sin ejecución arbitraria de procesos
- CORS: abierto
- Ideal para: desarrollo local

## Scanner de Seguridad

### Reglas Implementadas

| ID | Severidad | Patrón | Riesgo |
|----|-----------|--------|--------|
| SEC-001 | 🔴 Crítico | `eval()` | Ejecución arbitraria de código |
| SEC-002 | 🔴 Crítico | `new Function()` | Equivalente a eval |
| SEC-003 | 🔴 Crítico | `child_process` | Ejecución de comandos del SO |
| SEC-004 | 🟠 Alto | `fs.write*` | Modificación de archivos |
| SEC-005 | 🟠 Alto | `../` | Path traversal |
| SEC-006 | 🟡 Medio | `fetch/axios` | Acceso a red no controlado |
| SEC-007 | 🟡 Medio | `process.env` | Exposición de variables |
| SEC-008 | 🔴 Crítico | Secrets hardcoded | Credentials en código |
| SEC-009 | 🟡 Medio | `innerHTML` | XSS potential |
| SEC-010 | 🔵 Bajo | `JSON.parse` sin try | Crash potential |
| SEC-011 | ⚪ Info | `console.log` | Info leak potential |
| SEC-012 | ⚪ Info | `TODO/FIXME` | Código incompleto |

### Scoring

```
Score = 100 - penalties

Penalties:
- Critical: -30 puntos cada uno
- High: -15 puntos
- Medium: -8 puntos
- Low: -3 puntos
- Info: -1 punto

Pass thresholds:
- Strict: ≥ 90 AND no critical issues
- Standard: ≥ 70 AND no critical issues
- Permissive: ≥ 50
```

## Protecciones en la Aplicación

### API Routes
1. **Rate Limiting**: 10 generaciones/minuto por IP
2. **Input Validation**: Zod schemas en todos los endpoints
3. **Request Size**: Limitado por Next.js (default 4MB)
4. **Error Handling**: No se exponen stack traces en producción

### Headers de Seguridad (vercel.json)
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=31536000`

### Database
- Connection via SSL (`sslmode=require`)
- Parameterized queries (Drizzle ORM)
- No raw SQL expuesto al usuario
- Read-only donde sea posible

## Protecciones en MCPs Generados

### Input Validation
```typescript
// Toda herramienta generada incluye:
export function validateInput(input: string): string {
  // 1. Type check
  // 2. Length limit
  // 3. Sanitization (HTML, template literals, protocols)
  // 4. Empty check post-sanitization
}
```

### Path Validation
```typescript
// Para MCPs con acceso a filesystem:
export function validatePath(path: string, allowedRoot: string): string {
  // 1. Remove .. sequences
  // 2. Normalize separators
  // 3. Verify within allowedRoot
}
```

### Rate Limiting
```typescript
// Integrado en cada MCP generado:
export function rateLimiter(req, res, next): void {
  // Per-IP tracking
  // Configurable window (1 min default)
  // 429 response with retry-after
}
```

### Output Sanitization
```typescript
// Antes de enviar respuestas:
export function sanitizeOutput(output: unknown): unknown {
  // Redact emails
  // Redact API keys/tokens
  // Redact passwords
}
```

## Recomendaciones para Usuarios

1. **Siempre usar nivel "Standard" o superior en producción**
2. **No exponer MCPs HTTP sin autenticación adicional**
3. **Revisar el código generado antes de desplegar**
4. **Mantener dependencias actualizadas** (`npm audit`)
5. **Configurar variables de entorno, nunca hardcodear**
6. **Limitar los scopes de las herramientas al mínimo necesario**

## OWASP Top 10 Compliance

| # | Vulnerabilidad | Mitigación |
|---|---------------|------------|
| A01 | Broken Access Control | Rate limiting, input validation |
| A02 | Cryptographic Failures | No hardcoded secrets, env vars |
| A03 | Injection | Input sanitization, parameterized queries |
| A04 | Insecure Design | Security by default, scanner |
| A05 | Security Misconfiguration | Security headers, minimal permissions |
| A06 | Vulnerable Components | Current dependencies, npm audit |
| A07 | Auth Failures | Rate limiting, generic error messages |
| A08 | Data Integrity | Zod validation, type safety |
| A09 | Logging Failures | Error logging, audit trail |
| A10 | SSRF | URL validation, domain allowlist |
