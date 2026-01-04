import fs from 'node:fs/promises';
import {
  McpServer,
  ResourceTemplate,
} from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { UriTemplate } from '@modelcontextprotocol/sdk/shared/uriTemplate.js';
import z from 'zod';

// Create a new MCP server instance
const server = new McpServer({
  name: 'mcp-typescript',
  version: '0.0.1',
});

// Main function to connect the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

// Register a tool to create a new user
server.registerTool(
  'create-user',
  {
    title: 'Create User',
    description: 'Create a new user in the database',
    annotations: {
      idempotentHint: false,
      readOnlyHint: false,
      destructiveHint: false,
      openWorldHint: true,
    },
    inputSchema: {
      name: z.string(),
      email: z.string(),
      address: z.string(),
      phone: z.string(),
    },
    outputSchema: { userId: z.number() },
  },
  async (props) => {
    try {
      const userId = await createUser(props);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ userId }),
          },
        ],
        structuredContent: { userId },
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error creating user: ${(error as Error).message}`,
          },
        ],
        structuredContent: { error: 'Error creating user' },
      };
    }
  },
);

// Function to create a new user and save to users.json
async function createUser(user: {
  name: string;
  email: string;
  address: string;
  phone: string;
}) {
  const users = await import('../data/users.json', {
    with: { type: 'json' },
  }).then((m) => m.default);
  const newUserId = users.length + 1;
  users.push({ id: newUserId, ...user });
  await fs.writeFile('./data/users.json', JSON.stringify(users, null, 2));
  return newUserId;
}

// Register a resource to get all users
server.registerResource(
  'users',
  'users://all',
  {
    title: 'All Users',
    description: 'A resource representing all users in the database',
    mimeType: 'application/json',
  },
  async (uri) => {
    const users = await import('../data/users.json', {
      with: { type: 'json' },
    }).then((m) => m.default);
    return {
      contents: [
        {
          uri: uri.href,
          text: JSON.stringify(users),
          mimeType: 'application/json',
        },
      ],
    };
  },
);

// Register a dynamic resource template for user details
server.registerResource(
  'user-profile',
  new ResourceTemplate('users://{userId}/profile', { list: undefined }),
  {
    title: 'User Profile',
    description: 'User profile information',
  },
  async (uri, { userId }, _extra) => {
    const users = await import('../data/users.json', {
      with: { type: 'json' },
    }).then((m) => m.default);
    const user = users.find((u) => u.id === Number(userId));
    if (!user) {
      return {
        contents: [
          { uri: uri.href, text: 'User not found', mimeType: 'text/plain' },
        ],
      };
    } else {
      return {
        contents: [
          {
            uri: uri.href,
            text: JSON.stringify(user),
            mimeType: 'application/json',
          },
        ],
      };
    }
  },
);

// Start the server
main();
