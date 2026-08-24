import type { McpProjectConfig, Platform, PlatformConfig } from "@/types";

/**
 * Platform Adapter Interface
 * Each AI platform has its own configuration format for MCP servers
 */
export interface PlatformAdapter {
  platform: Platform;
  name: string;
  generateConfig(config: McpProjectConfig): PlatformConfig;
  getSetupInstructions(serverName: string): string;
}

// ============ CLAUDE CODE ============
class ClaudeCodeAdapter implements PlatformAdapter {
  platform: Platform = "claude_code";
  name = "Claude Code";

  generateConfig(config: McpProjectConfig): PlatformConfig {
    const serverSlug = config.name.toLowerCase().replace(/\s+/g, "-");

    const configContent =
      config.transport === "stdio"
        ? JSON.stringify(
            {
              mcpServers: {
                [serverSlug]: {
                  command: "node",
                  args: [`./dist/index.js`],
                  env: {},
                },
              },
            },
            null,
            2
          )
        : JSON.stringify(
            {
              mcpServers: {
                [serverSlug]: {
                  type: "http",
                  url: "http://localhost:3001/mcp",
                },
              },
            },
            null,
            2
          );

    return {
      platform: "claude_code",
      configFile: "claude_code_config.json",
      configContent,
      installCommand:
        config.transport === "stdio"
          ? `claude mcp add-json ${serverSlug} '${JSON.stringify({ command: "node", args: ["./dist/index.js"] })}'`
          : `claude mcp add ${serverSlug} --transport http http://localhost:3001/mcp`,
      setupInstructions: this.getSetupInstructions(serverSlug),
    };
  }

  getSetupInstructions(serverName: string): string {
    return `### Claude Code

\`\`\`bash
# Option 1: Using CLI
claude mcp add-json ${serverName} '{"command":"node","args":["./dist/index.js"]}'

# Option 2: Manual config in ~/.claude/settings.json
# Add to mcpServers section

# Verify connection
claude mcp list
\`\`\``;
  }
}

// ============ OPENAI CODEX ============
class OpenAICodexAdapter implements PlatformAdapter {
  platform: Platform = "openai_codex";
  name = "OpenAI Codex";

  generateConfig(config: McpProjectConfig): PlatformConfig {
    const serverSlug = config.name.toLowerCase().replace(/\s+/g, "-");

    const configContent = JSON.stringify(
      {
        mcpServers: {
          [serverSlug]:
            config.transport === "stdio"
              ? {
                  type: "stdio",
                  command: "node",
                  args: ["./dist/index.js"],
                }
              : {
                  type: "http",
                  url: "http://localhost:3001/mcp",
                },
        },
      },
      null,
      2
    );

    return {
      platform: "openai_codex",
      configFile: "codex_config.json",
      configContent,
      installCommand: `codex mcp add ${serverSlug} -- node ./dist/index.js`,
      setupInstructions: this.getSetupInstructions(serverSlug),
    };
  }

  getSetupInstructions(serverName: string): string {
    return `### OpenAI Codex

\`\`\`bash
# Add MCP server to Codex
codex mcp add ${serverName} -- node ./dist/index.js

# Or configure in ~/.codex/config.json
# Add to mcpServers section

# Verify
codex mcp list
\`\`\``;
  }
}

// ============ OPENCODE ============
class OpenCodeAdapter implements PlatformAdapter {
  platform: Platform = "opencode";
  name = "OpenCode";

  generateConfig(config: McpProjectConfig): PlatformConfig {
    const serverSlug = config.name.toLowerCase().replace(/\s+/g, "-");

    const configContent = JSON.stringify(
      {
        mcp: {
          servers: {
            [serverSlug]: {
              command: "node",
              args: ["./dist/index.js"],
              type: config.transport,
            },
          },
        },
      },
      null,
      2
    );

    return {
      platform: "opencode",
      configFile: "opencode_config.json",
      configContent,
      installCommand: `# Add to opencode.json in project root`,
      setupInstructions: this.getSetupInstructions(serverSlug),
    };
  }

  getSetupInstructions(serverName: string): string {
    return `### OpenCode

\`\`\`bash
# Add to your opencode.json configuration:
# {
#   "mcp": {
#     "servers": {
#       "${serverName}": {
#         "command": "node",
#         "args": ["./dist/index.js"]
#       }
#     }
#   }
# }
\`\`\``;
  }
}

// ============ ANTIGRAVITY ============
class AntigravityAdapter implements PlatformAdapter {
  platform: Platform = "antigravity";
  name = "Antigravity";

  generateConfig(config: McpProjectConfig): PlatformConfig {
    const serverSlug = config.name.toLowerCase().replace(/\s+/g, "-");

    const configContent = JSON.stringify(
      {
        mcpServers: {
          [serverSlug]: {
            command: "node",
            args: ["./dist/index.js"],
            transport: config.transport,
          },
        },
      },
      null,
      2
    );

    return {
      platform: "antigravity",
      configFile: "antigravity_config.json",
      configContent,
      installCommand: `# Configure in Antigravity settings`,
      setupInstructions: this.getSetupInstructions(serverSlug),
    };
  }

  getSetupInstructions(serverName: string): string {
    return `### Antigravity

\`\`\`bash
# Add to your Antigravity MCP configuration:
# Settings > MCP Servers > Add Server
# Name: ${serverName}
# Command: node ./dist/index.js
# Transport: stdio
\`\`\``;
  }
}

// ============ CURSOR ============
class CursorAdapter implements PlatformAdapter {
  platform: Platform = "cursor";
  name = "Cursor";

  generateConfig(config: McpProjectConfig): PlatformConfig {
    const serverSlug = config.name.toLowerCase().replace(/\s+/g, "-");

    const configContent = JSON.stringify(
      {
        mcpServers: {
          [serverSlug]: {
            command: "node",
            args: ["./dist/index.js"],
          },
        },
      },
      null,
      2
    );

    return {
      platform: "cursor",
      configFile: ".cursor/mcp.json",
      configContent,
      installCommand: `# Add to .cursor/mcp.json in project root`,
      setupInstructions: this.getSetupInstructions(serverSlug),
    };
  }

  getSetupInstructions(serverName: string): string {
    return `### Cursor

\`\`\`bash
# Create .cursor/mcp.json in your project root:
# {
#   "mcpServers": {
#     "${serverName}": {
#       "command": "node",
#       "args": ["./dist/index.js"]
#     }
#   }
# }
\`\`\``;
  }
}

// ============ KIRO ============
class KiroAdapter implements PlatformAdapter {
  platform: Platform = "kiro";
  name = "Kiro";

  generateConfig(config: McpProjectConfig): PlatformConfig {
    const serverSlug = config.name.toLowerCase().replace(/\s+/g, "-");

    const configContent = JSON.stringify(
      {
        mcpServers: {
          [serverSlug]: {
            command: "node",
            args: ["./dist/index.js"],
          },
        },
      },
      null,
      2
    );

    return {
      platform: "kiro",
      configFile: ".kiro/mcp.json",
      configContent,
      installCommand: `# Add to .kiro/settings/mcp.json`,
      setupInstructions: this.getSetupInstructions(serverSlug),
    };
  }

  getSetupInstructions(serverName: string): string {
    return `### Kiro

\`\`\`bash
# Add to .kiro/settings/mcp.json:
# {
#   "mcpServers": {
#     "${serverName}": {
#       "command": "node",
#       "args": ["./dist/index.js"]
#     }
#   }
# }
\`\`\``;
  }
}

// ============ UNIVERSAL ============
class UniversalAdapter implements PlatformAdapter {
  platform: Platform = "universal";
  name = "Universal (Generic)";

  generateConfig(config: McpProjectConfig): PlatformConfig {
    const serverSlug = config.name.toLowerCase().replace(/\s+/g, "-");

    const configContent = JSON.stringify(
      {
        name: serverSlug,
        version: "1.0.0",
        transport: config.transport,
        command: "node",
        args: ["./dist/index.js"],
        env: {},
      },
      null,
      2
    );

    return {
      platform: "universal",
      configFile: "mcp_config.json",
      configContent,
      installCommand: `node ./dist/index.js`,
      setupInstructions: this.getSetupInstructions(serverSlug),
    };
  }

  getSetupInstructions(serverName: string): string {
    return `### Universal (Any MCP-Compatible Client)

\`\`\`bash
# Build the server
npm run build

# Run directly
node ./dist/index.js

# Or use with any MCP client that supports stdio:
# Configure command: "node" with args: ["./dist/index.js"]
\`\`\``;
  }
}

// ============ FACTORY ============

const adapters: Record<Platform, PlatformAdapter> = {
  claude_code: new ClaudeCodeAdapter(),
  openai_codex: new OpenAICodexAdapter(),
  opencode: new OpenCodeAdapter(),
  antigravity: new AntigravityAdapter(),
  cursor: new CursorAdapter(),
  kiro: new KiroAdapter(),
  universal: new UniversalAdapter(),
};

export function getPlatformAdapter(platform: Platform): PlatformAdapter {
  return adapters[platform] || adapters.universal;
}

export function getAllPlatforms(): PlatformAdapter[] {
  return Object.values(adapters);
}
