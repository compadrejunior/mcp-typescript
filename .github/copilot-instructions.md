# MCP TypeScript Server Development Guide

## Project Overview

This is a **Model Context Protocol (MCP) server** that enables AI assistants to interact with user data through standardized tools and resources. The server runs as a stdio-based service using JSON-RPC for communication.

**Key Architecture**:
- **Transport**: Stdio-based (StdioServerTransport) - communicates via stdin/stdout
- **Data Storage**: JSON file at [data/users.json](data/users.json) - simple append-only user database
- **MCP SDK**: `@modelcontextprotocol/sdk` provides the core server implementation

## Development Workflow

**Package Manager**: Use `pnpm` exclusively (not npm/yarn) - configured in `package.json`

**Essential Commands**:
```bash
pnpm run server:dev          # Hot-reload development with tsx
pnpm run server:inspect      # Launch MCP Inspector UI for interactive testing
pnpm run server:build        # Compile TypeScript
pnpm run server:build:watch  # Watch mode compilation
```

**Critical**: Always test changes using `server:inspect` - it provides a UI to invoke tools and resources directly, essential for verifying MCP functionality.

## Code Patterns & Conventions

### Tool Registration Pattern

Tools are actions AI assistants can invoke. Register using this structure from [src/server.ts](src/server.ts#L15-L59):

```typescript
server.registerTool(
  'tool-name',
  {
    title: 'Human Readable Title',
    description: 'What this tool does',
    annotations: {
      idempotentHint: false,      // Can run multiple times safely?
      readOnlyHint: false,         // Only reads, no mutations?
      destructiveHint: false,      // Deletes/destroys data?
      openWorldHint: true,         // Flexible input variations?
    },
    inputSchema: { /* Zod schema */ },
    outputSchema: { /* Zod schema */ },
  },
  async (props) => {
    // Implementation
    return {
      content: [{ type: 'text', text: 'response' }],
      structuredContent: { /* typed object */ },
    };
  }
);
```

### Resource Registration Pattern

Resources provide read-only data access. Example from [src/server.ts](src/server.ts#L78-L97):

```typescript
server.registerResource(
  'resource-name',
  'scheme://path',  // URI pattern
  {
    title: 'Resource Title',
    description: 'What data this provides',
    mimeType: 'application/json',
  },
  async (uri) => {
    return {
      contents: [{ uri: uri.href, text: '...', mimeType: 'application/json' }],
    };
  }
);
```

### Data Persistence Pattern

Current implementation uses JSON file with dynamic imports:

```typescript
const data = await import('../data/users.json', {
  with: { type: 'json' }
}).then((m) => m.default);

// Modify data
await fs.writeFile('./data/users.json', JSON.stringify(data, null, 2));
```

**Important**: ID generation is `users.length + 1` - assumes append-only pattern, no deletions.

## TypeScript Configuration

- **Module System**: `nodenext` - requires `.js` extensions in imports even for `.ts` files
- **Target**: ES2016
- **Root**: All source in `src/`, compiles to root directory

## Code Quality Tools

- **Biome** (not ESLint/Prettier): Formatter + linter configured in [biome.json](biome.json)
  - Single quotes for JS/TS
  - 2-space indentation
  - 80-character line width
  - Auto-organize imports enabled

## Security Requirements

Follow Snyk security practices defined in [.github/instructions/snyk_rules.instructions.md](.github/instructions/snyk_rules.instructions.md):
- Scan all new code with Snyk Code
- Fix security issues before completion
- Rescan after fixes until clean

## Integration Points

**MCP Inspector**: The `server:inspect` script sets `DANGEROUSLY_OMIT_AUTH=true` and launches `@modelcontextprotocol/inspector` - this is the primary testing interface. Changes to tools/resources should be verified here.

**AI Client Integration**: Clients discover capabilities via:
1. Connect to stdio transport
2. Request available tools/resources
3. Invoke tools or fetch resources using MCP protocol

## Common Pitfalls

1. **Don't forget `.js` extensions** in imports - required by `nodenext` module resolution
2. **ID generation is fragile** - current `length + 1` approach breaks if users are deleted
3. **Error handling in tools** - always wrap in try/catch, return structured error responses
4. **MCP Inspector requires auth bypass** - `DANGEROUSLY_OMIT_AUTH=true` is intentional for local testing
