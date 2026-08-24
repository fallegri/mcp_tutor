import JSZip from "jszip";
import { saveAs } from "file-saver";
import type { GenerationResult, GeneratedFile, PlatformConfig } from "@/types";

/**
 * Download Utilities
 *
 * Generates ZIP archives from MCP generation results
 * so users can download the entire project in one click.
 */

/**
 * Download all generated files as a single ZIP archive
 */
export async function downloadProjectAsZip(
  result: GenerationResult
): Promise<void> {
  const zip = new JSZip();
  const projectName = result.project.name.toLowerCase().replace(/\s+/g, "-");

  // Create project folder inside ZIP
  const projectFolder = zip.folder(projectName);
  if (!projectFolder) throw new Error("Failed to create ZIP folder");

  // Add all generated source files
  for (const file of result.files) {
    projectFolder.file(file.path, file.content);
  }

  // Add platform configuration files in a configs/ folder
  const configsFolder = projectFolder.folder("configs");
  if (configsFolder) {
    for (const config of result.platformConfigs) {
      configsFolder.file(config.configFile, config.configContent);

      // Also add a setup instructions file per platform
      const instructionsFilename = `SETUP_${config.platform.toUpperCase()}.md`;
      configsFolder.file(instructionsFilename, config.setupInstructions);
    }
  }

  // Add security report as JSON
  projectFolder.file(
    "SECURITY_REPORT.json",
    JSON.stringify(result.securityReport, null, 2)
  );

  // Add a quick-start guide
  projectFolder.file("QUICK_START.md", generateQuickStart(result));

  // Generate and trigger download
  const blob = await zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });

  saveAs(blob, `${projectName}.zip`);
}

/**
 * Download a single file
 */
export function downloadSingleFile(file: GeneratedFile): void {
  const blob = new Blob([file.content], { type: "text/plain;charset=utf-8" });
  saveAs(blob, file.path.split("/").pop() || "file.txt");
}

/**
 * Download tutor documentation as Markdown
 */
export function downloadTutorDocs(content: string, filename: string): void {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  saveAs(blob, filename);
}

/**
 * Generate a QUICK_START.md for the ZIP
 */
function generateQuickStart(result: GenerationResult): string {
  return `# 🚀 Quick Start - ${result.project.name}

## Instalación

\`\`\`bash
# 1. Instalar dependencias
npm install

# 2. Compilar TypeScript
npm run build

# 3. Ejecutar el servidor
npm start
\`\`\`

## Desarrollo

\`\`\`bash
# Modo desarrollo con hot-reload
npm run dev
\`\`\`

## Conectar a tu plataforma AI

Los archivos de configuración están en la carpeta \`configs/\`.
Cada plataforma tiene su archivo de setup:

${result.platformConfigs.map((c) => `- **${c.platform}**: \`configs/${c.configFile}\``).join("\n")}

## Seguridad

- Score: ${result.securityReport.score}/100
- Nivel: ${result.securityReport.level}
- Estado: ${result.securityReport.passed ? "✅ Aprobado" : "⚠️ Revisar issues"}

${
  result.securityReport.issues.length > 0
    ? `### Issues a resolver:\n${result.securityReport.issues.map((i) => `- [${i.severity.toUpperCase()}] ${i.title}`).join("\n")}`
    : "No se encontraron issues de seguridad. ✅"
}

## Estructura del proyecto

\`\`\`
${result.files.map((f) => f.path).join("\n")}
\`\`\`

---
*Generado por MCP Builder*
`;
}
