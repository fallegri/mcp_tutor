import type { McpProjectConfig, MermaidDiagram } from "@/types";

/**
 * Tutor Diagram Generator
 * 
 * Generates Mermaid diagrams compatible with Google Docs/Word
 * that explain the MCP architecture in a visual, non-technical way
 */
export class DiagramGenerator {
  /**
   * Generate all diagrams for a project
   */
  generateAll(config: McpProjectConfig): MermaidDiagram[] {
    return [
      this.generateArchitectureOverview(config),
      this.generateDataFlow(config),
      this.generateSecurityFlow(config),
      this.generateToolsOverview(config),
      this.generateDeploymentDiagram(config),
      this.generateInteractionSequence(config),
    ];
  }

  /**
   * Architecture Overview - Shows the big picture
   */
  private generateArchitectureOverview(
    config: McpProjectConfig
  ): MermaidDiagram {
    const platformNodes = config.targetPlatforms
      .map(
        (p, i) => `    P${i}[${this.getPlatformDisplayName(p)}]`
      )
      .join("\n");

    const platformConnections = config.targetPlatforms
      .map((_, i) => `    P${i} -->|"Conecta via MCP"| Server`)
      .join("\n");

    const toolNodes = config.skills
      .map(
        (s, i) => `    T${i}["🔧 ${s.name}"]`
      )
      .join("\n");

    const toolConnections = config.skills
      .map((_, i) => `    Server --> T${i}`)
      .join("\n");

    return {
      id: "architecture-overview",
      title: "Visión General de la Arquitectura",
      description:
        "Muestra cómo se conectan los clientes AI con el servidor MCP y sus herramientas",
      type: "flowchart",
      code: `flowchart TB
    subgraph Clientes["🤖 Clientes AI"]
${platformNodes}
    end

    subgraph MCP["🔌 Servidor MCP: ${config.name}"]
        Server["🖥️ Servidor Principal"]
        Security["🛡️ Módulo de Seguridad"]
        Validator["✅ Validador"]
    end

    subgraph Tools["🧰 Herramientas"]
${toolNodes}
    end

${platformConnections}
    Server --> Security
    Security --> Validator
${toolConnections}

    style Clientes fill:#e1f5fe,stroke:#01579b
    style MCP fill:#f3e5f5,stroke:#4a148c
    style Tools fill:#e8f5e9,stroke:#1b5e20`,
    };
  }

  /**
   * Data Flow - Shows how data moves through the system
   */
  private generateDataFlow(config: McpProjectConfig): MermaidDiagram {
    return {
      id: "data-flow",
      title: "Flujo de Datos",
      description:
        "Muestra paso a paso cómo viaja la información desde el usuario hasta la respuesta",
      type: "flowchart",
      code: `flowchart LR
    A["👤 Usuario"] -->|"1. Escribe comando"| B["🤖 Cliente AI"]
    B -->|"2. Envía petición JSON-RPC"| C["🔌 Servidor MCP"]
    C -->|"3. Valida input"| D["🛡️ Seguridad"]
    D -->|"4. Input válido"| E["🔧 Herramienta"]
    E -->|"5. Procesa"| F["📊 Resultado"]
    F -->|"6. Respuesta JSON"| B
    B -->|"7. Muestra resultado"| A

    style A fill:#fff3e0,stroke:#e65100
    style D fill:#fce4ec,stroke:#b71c1c
    style E fill:#e8f5e9,stroke:#1b5e20
    style F fill:#e3f2fd,stroke:#0d47a1`,
    };
  }

  /**
   * Security Flow - Shows security validations
   */
  private generateSecurityFlow(config: McpProjectConfig): MermaidDiagram {
    const levelText =
      config.securityLevel === "strict"
        ? "Máxima Seguridad"
        : config.securityLevel === "standard"
          ? "Seguridad Estándar"
          : "Seguridad Básica";

    return {
      id: "security-flow",
      title: `Flujo de Seguridad (${levelText})`,
      description:
        "Detalla cada validación de seguridad que se aplica a las peticiones",
      type: "flowchart",
      code: `flowchart TD
    A["📨 Petición Entrante"] --> B{"🔍 ¿Input válido?"}
    B -->|"No"| C["❌ Rechazar"]
    B -->|"Sí"| D{"📏 ¿Dentro de límite?"}
    D -->|"No: > ${config.securityLevel === "strict" ? "500" : config.securityLevel === "standard" ? "2000" : "5000"} chars"| C
    D -->|"Sí"| E{"🧹 Sanitización"}
    E --> F{"⚡ ¿Rate limit OK?"}
    F -->|"No: Excede límite"| G["⏳ 429 - Esperar"]
    F -->|"Sí"| H{"📋 ¿Schema válido?"}
    H -->|"No"| C
    H -->|"Sí"| I["✅ Procesar"]
    I --> J{"🔒 ¿Output seguro?"}
    J -->|"Contiene secrets"| K["🔏 Redactar"]
    J -->|"Limpio"| L["📤 Responder"]
    K --> L

    style C fill:#ffcdd2,stroke:#b71c1c
    style G fill:#fff9c4,stroke:#f57f17
    style I fill:#c8e6c9,stroke:#1b5e20
    style L fill:#bbdefb,stroke:#0d47a1`,
    };
  }

  /**
   * Tools Overview - Shows available tools and their purpose
   */
  private generateToolsOverview(config: McpProjectConfig): MermaidDiagram {
    const toolDetails = config.skills
      .map(
        (s, i) => `    Tool${i}["🔧 ${s.name}"] --> Desc${i}["Procesa solicitudes"]`
      )
      .join("\n");

    return {
      id: "tools-overview",
      title: "Mapa de Herramientas",
      description:
        "Muestra cada herramienta disponible en el servidor MCP y su propósito",
      type: "flowchart",
      code: `flowchart TB
    Server["🖥️ ${config.name}"]
${config.skills
  .map(
    (s, i) => `    Server --> Tool${i}["🔧 ${s.name}"]
    Tool${i} --> Input${i}["📥 Recibe: query (texto)"]
    Tool${i} --> Output${i}["📤 Devuelve: resultado JSON"]`
  )
  .join("\n")}

    style Server fill:#e1f5fe,stroke:#01579b`,
    };
  }

  /**
   * Deployment Diagram
   */
  private generateDeploymentDiagram(config: McpProjectConfig): MermaidDiagram {
    const isLocal = config.transport === "stdio";

    return {
      id: "deployment",
      title: "Diagrama de Despliegue",
      description: isLocal
        ? "Muestra cómo se ejecuta el servidor localmente"
        : "Muestra cómo se despliega el servidor en la nube",
      type: "flowchart",
      code: isLocal
        ? `flowchart TB
    subgraph Local["💻 Tu Computadora"]
        Client["🤖 Cliente AI"]
        Server["🖥️ Servidor MCP"]
        Client <-->|"stdio (entrada/salida estándar)"| Server
    end

    style Local fill:#f5f5f5,stroke:#424242`
        : `flowchart TB
    subgraph Cloud["☁️ Nube (Vercel)"]
        Server["🖥️ Servidor MCP"]
        DB["🗄️ Base de Datos (Neon)"]
        Server <--> DB
    end

    subgraph Local["💻 Tu Computadora"]
        Client["🤖 Cliente AI"]
    end

    Client <-->|"HTTP/HTTPS"| Server

    style Cloud fill:#e3f2fd,stroke:#0d47a1
    style Local fill:#f5f5f5,stroke:#424242`,
    };
  }

  /**
   * Interaction Sequence Diagram
   */
  private generateInteractionSequence(
    config: McpProjectConfig
  ): MermaidDiagram {
    return {
      id: "interaction-sequence",
      title: "Secuencia de Interacción",
      description:
        "Muestra el orden temporal de las comunicaciones entre componentes",
      type: "sequence",
      code: `sequenceDiagram
    participant U as 👤 Usuario
    participant C as 🤖 Cliente AI
    participant S as 🖥️ Servidor MCP
    participant Sec as 🛡️ Seguridad
    participant T as 🔧 Herramienta

    U->>C: Escribe solicitud
    C->>S: JSON-RPC: tools/call
    S->>Sec: Validar input
    Sec-->>S: ✅ Input válido
    S->>T: Ejecutar herramienta
    T-->>S: Resultado
    S->>Sec: Sanitizar output
    Sec-->>S: ✅ Output limpio
    S-->>C: JSON-RPC: resultado
    C-->>U: Muestra respuesta`,
    };
  }

  /**
   * Get display name for a platform
   */
  private getPlatformDisplayName(platform: string): string {
    const names: Record<string, string> = {
      claude_code: "🟣 Claude Code",
      openai_codex: "🟢 OpenAI Codex",
      opencode: "🔵 OpenCode",
      antigravity: "🟡 Antigravity",
      cursor: "⚫ Cursor",
      kiro: "🟠 Kiro",
      universal: "⚪ Universal",
    };
    return names[platform] || platform;
  }
}

export const diagramGenerator = new DiagramGenerator();
