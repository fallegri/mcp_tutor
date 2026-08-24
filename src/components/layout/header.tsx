export function Header() {
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🔌</span>
          <span className="text-xl font-bold">MCP Builder</span>
          <span className="text-xs px-2 py-0.5 rounded bg-primary/20 text-primary">
            v1.0
          </span>
        </div>
        <nav className="flex items-center gap-4">
          <a
            href="https://modelcontextprotocol.io"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            MCP Spec
          </a>
          <a
            href="https://github.com/modelcontextprotocol/typescript-sdk"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            SDK
          </a>
        </nav>
      </div>
    </header>
  );
}
