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
    outputSchema: { userId: z.string() },
  },
  async ({ name, email, address, phone }) => {
    const userId = crypto.randomUUID();
    console.log(`Creating user: ${name}, ${email}, ${address}, ${phone}`);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ userId }),
        },
      ],
      structuredContent: { userId },
    };
  },
);

main();
