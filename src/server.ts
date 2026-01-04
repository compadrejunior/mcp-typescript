import fs from 'node:fs/promises';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import z from 'zod';

const server = new McpServer({
  name: 'mcp-typescript',
  version: '0.0.1',
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

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

main();
