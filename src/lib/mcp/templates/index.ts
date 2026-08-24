import type { SecurityLevel, Transport } from "@/types";

/**
 * Get the appropriate template based on transport and security level
 */
export function getTemplate(
  transport: Transport,
  securityLevel: SecurityLevel
): string {
  const templates: Record<Transport, Record<SecurityLevel, string>> = {
    stdio: {
      strict: STDIO_STRICT_TEMPLATE,
      standard: STDIO_STANDARD_TEMPLATE,
      permissive: STDIO_PERMISSIVE_TEMPLATE,
    },
    http: {
      strict: HTTP_STRICT_TEMPLATE,
      standard: HTTP_STANDARD_TEMPLATE,
      permissive: HTTP_PERMISSIVE_TEMPLATE,
    },
    sse: {
      strict: HTTP_STRICT_TEMPLATE,
      standard: HTTP_STANDARD_TEMPLATE,
      permissive: HTTP_PERMISSIVE_TEMPLATE,
    },
  };

  return templates[transport][securityLevel];
}

// ============ STDIO TEMPLATES ============

const STDIO_STRICT_TEMPLATE = `
// STRICT SECURITY MODE
// - All inputs validated and sanitized
// - No filesystem access
// - No network access
// - No shell execution
// - Maximum input: 500 chars
// - Rate limit: 10/min
`;

const STDIO_STANDARD_TEMPLATE = `
// STANDARD SECURITY MODE
// - All inputs validated
// - Limited filesystem access (read-only, specified paths)
// - Limited network access (allowlisted domains)
// - No shell execution
// - Maximum input: 2000 chars
// - Rate limit: 50/min
`;

const STDIO_PERMISSIVE_TEMPLATE = `
// PERMISSIVE SECURITY MODE
// - Basic input validation
// - Filesystem access (within project scope)
// - Network access allowed
// - No arbitrary shell execution
// - Maximum input: 5000 chars
// - Rate limit: 100/min
`;

// ============ HTTP TEMPLATES ============

const HTTP_STRICT_TEMPLATE = `
// STRICT SECURITY MODE (HTTP)
// - All inputs validated and sanitized
// - CORS restricted to specific origins
// - Authentication required
// - No filesystem access
// - Rate limit: 10/min per IP
// - Request size limit: 1KB
`;

const HTTP_STANDARD_TEMPLATE = `
// STANDARD SECURITY MODE (HTTP)
// - All inputs validated
// - CORS configured
// - Optional authentication
// - Limited filesystem access
// - Rate limit: 50/min per IP
// - Request size limit: 10KB
`;

const HTTP_PERMISSIVE_TEMPLATE = `
// PERMISSIVE SECURITY MODE (HTTP)
// - Basic input validation
// - CORS open
// - No authentication required
// - Filesystem access within scope
// - Rate limit: 100/min per IP
// - Request size limit: 100KB
`;
