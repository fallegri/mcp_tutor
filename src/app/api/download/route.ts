import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";
import { z } from "zod";

/**
 * API Route: POST /api/download
 * 
 * Generates a ZIP file server-side from the generation result.
 * This is an alternative to client-side ZIP generation for
 * browsers with limited support.
 * 
 * Body: { projectName: string, files: GeneratedFile[], platformConfigs: PlatformConfig[] }
 */

const FileSchema = z.object({
  path: z.string(),
  content: z.string(),
  language: z.string(),
  description: z.string(),
});

const PlatformConfigSchema = z.object({
  platform: z.string(),
  configFile: z.string(),
  configContent: z.string(),
  installCommand: z.string(),
  setupInstructions: z.string(),
});

const DownloadRequestSchema = z.object({
  projectName: z.string().min(1).max(100),
  files: z.array(FileSchema).min(1).max(50),
  platformConfigs: z.array(PlatformConfigSchema).max(10),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = DownloadRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const { projectName, files, platformConfigs } = validation.data;
    const slug = projectName.toLowerCase().replace(/\s+/g, "-");

    // Create ZIP
    const zip = new JSZip();
    const folder = zip.folder(slug);

    if (!folder) {
      return NextResponse.json(
        { error: "Failed to create ZIP" },
        { status: 500 }
      );
    }

    // Add source files
    for (const file of files) {
      folder.file(file.path, file.content);
    }

    // Add platform configs
    const configsFolder = folder.folder("configs");
    if (configsFolder) {
      for (const config of platformConfigs) {
        configsFolder.file(config.configFile, config.configContent);
        configsFolder.file(
          `SETUP_${config.platform.toUpperCase()}.md`,
          config.setupInstructions
        );
      }
    }

    // Generate ZIP buffer
    const zipBuffer = await zip.generateAsync({
      type: "arraybuffer",
      compression: "DEFLATE",
      compressionOptions: { level: 6 },
    });

    // Return as downloadable file
    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${slug}.zip"`,
      },
    });
  } catch (error) {
    console.error("Download generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate download" },
      { status: 500 }
    );
  }
}
