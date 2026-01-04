# MCP (Model Context Protocol) with TypeScript

This repository contains a TypeScript implementation of the Model Context Protocol (MCP). MCP is designed to facilitate communication and data exchange between different machine learning models and applications.

## Requirements and Dependencies
- Node.js (version 14 or higher)
- TypeScript
- npm (Node Package Manager)


## Features
- Type-safe interfaces for defining model contexts
- Easy integration with existing TypeScript projects
- Support for various data formats and serialization methods
- Comprehensive documentation and examples

## Installation
Clone this repository and install the necessary dependencies using npm:

```bash
git clone https://github.com/compadrejunior/mcp-typescript.git
cd mcp-typescript
npm install
```

## Scripts
- `npm run server:build`: Compiles the TypeScript code to JavaScript.
- `npm run server:build:watch`: Watches for changes and recompiles the code automatically.
- `server:dev`: Starts the development server with hot-reloading.
- `server:inspect`: Starts the server with the MCP Inspector enabled.

## Installing in your Visual Studio Code
To use this MCP implementation in your Visual Studio Code project, follow these steps:
1. Open your project in Visual Studio Code.
2. Open the command palette (Ctrl+Shift+P or Cmd+Shift+P).
3. Type MCP: Add Server.
4. Select Command (stdio).
5. Enter the name for your MCP server.
6. Select where you want to use it (e.g. Worskpace or User).


## Implementation Explanation

This project implements a **Model Context Protocol (MCP) Server** that provides AI assistants with controlled access to user data and operations through a standardized interface.

### Project Architecture

The server is built using the `@modelcontextprotocol/sdk` and runs as a stdio-based service that communicates with AI clients (like Claude, GitHub Copilot, etc.).

### Core Components

#### 1. **MCP Server Instance** ([src/server.ts](src/server.ts#L6-L9))
```typescript
const server = new McpServer({
  name: 'mcp-typescript',
  version: '0.0.1',
});
```
Creates the main server instance with metadata that identifies this MCP service.

#### 2. **Transport Layer** ([src/server.ts](src/server.ts#L11-L13))
```typescript
const transport = new StdioServerTransport();
await server.connect(transport);
```
Uses stdio (standard input/output) for communication, allowing the server to exchange JSON-RPC messages with AI clients through stdin/stdout streams.

#### 3. **Tool: `create-user`** ([src/server.ts](src/server.ts#L15-L59))
A **tool** is an action that AI assistants can invoke. This tool creates new users in the database:

- **Input Schema**: Defines required fields (name, email, address, phone) using Zod validation
- **Output Schema**: Returns the newly created user's ID
- **Annotations**: 
  - `idempotentHint: false` - Running twice creates duplicate users
  - `readOnlyHint: false` - Modifies data
  - `destructiveHint: false` - Doesn't delete existing data
  - `openWorldHint: true` - Can be used with various inputs

**Implementation Flow**:
1. Reads existing users from [data/users.json](data/users.json)
2. Generates a new ID (max ID + 1)
3. Appends the new user to the array
4. Writes the updated data back to the JSON file
5. Returns the new user ID or an error message

#### 4. **Resource: `users`** ([src/server.ts](src/server.ts#L78-L97))
A **resource** is read-only data that AI assistants can access. This resource provides access to all users:

- **URI**: `users://all` - A unique identifier for this resource
- **MIME Type**: `application/json`
- **Content**: Returns all users from the database as JSON

**Implementation Flow**:
1. Dynamically imports the users.json file
2. Returns the entire user list as structured JSON content

### Data Storage

The application uses a simple JSON file ([data/users.json](data/users.json)) as a database, containing an array of user objects with fields: `id`, `name`, `email`, `address`, and `phone`.

### How AI Assistants Use This Server

1. **Discovery**: The AI client connects to the server and discovers available tools and resources
2. **Reading Data**: The AI can request the `users://all` resource to view all users
3. **Creating Users**: The AI can invoke the `create-user` tool with user details to add new records
4. **Response Handling**: All responses are formatted with both human-readable text and structured data

### Development Workflow

- **Build**: `npm run server:build` - Compiles TypeScript to JavaScript
- **Development**: `npm run server:dev` - Runs with hot-reload using tsx
- **Inspection**: `npm run server:inspect` - Opens the MCP Inspector UI to test tools and resources interactively

### Key Technologies

- **TypeScript**: Provides type safety and better developer experience
- **Zod**: Schema validation for input/output data
- **@modelcontextprotocol/sdk**: Official MCP implementation library
- **Node.js fs/promises**: Asynchronous file system operations

