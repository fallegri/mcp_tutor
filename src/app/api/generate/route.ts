import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { McpGenerator } from "@/lib/mcp/generator";
import type { McpProjectConfig } from "@/types";

// Input validation schema
const GenerateRequestSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().min(10).max(1000),
  objective: z.string().min(10).max(2000),
  mode: z.enum(["orchestrator", "tutor"]),
  targetPlatforms: z.array(
    z.enum([
      "claude_code",
      "openai_codex",
      "opencode",
      "antigravity",
      "cursor",
      "kiro",
      "universal",
    ])
  ).min(1),
  transport: z.enum(["stdio", "http", "sse"]),
  securityLevel: z.enum(["strict", "standard", "permissive"]),
  skills: z.array(
    z.object({
      id: z.string(),
      name: z.string().min(1).max(100),
      customParams: z.record(z.unknown()).optional(),
    })
  ).min(1),
  additionalMaterial: z.array(
    z.object({
      name: z.string(),
      type: z.enum(["documentation", "code", "specification", "example"]),
      content: z.string().max(50000),
    })
  ).optional(),
});

// Rate limiting state (simple in-memory for demo)
const requestCounts = new Map<string, { count: number; resetAt: number }>();

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIp =
      request.headers.get("x-forwarded-for") || "unknown";
    const now = Date.now();
    const rateState = requestCounts.get(clientIp);

    if (rateState && now < rateState.resetAt && rateState.count >= 10) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Try again later." },
        { status: 429 }
      );
    }

    if (!rateState || now > (rateState?.resetAt || 0)) {
      requestCounts.set(clientIp, { count: 1, resetAt: now + 60000 });
    } else {
      rateState.count++;
    }

    // Parse and validate body
    const body = await request.json();
    const validation = GenerateRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid input",
          details: validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    const config: McpProjectConfig = validation.data;

    // Generate MCP
    const generator = new McpGenerator();
    const result = await generator.generate(config);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Generation error:", error);
    return NextResponse.json(
      { error: "Internal server error during generation" },
      { status: 500 }
    );
  }
}
