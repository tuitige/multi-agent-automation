import { z } from 'zod';
import { tool } from '@langchain/core/tools';
import { McpClient, McpToolRequest } from './mcp-client';

const createZohoLeadSchema = z.object({
  firstName: z.string().describe('First name of the lead'),
  lastName: z.string().describe('Last name of the lead'),
  email: z.string().email().describe('Email address of the lead'),
  company: z.string().describe('Company name'),
  phone: z.string().optional().describe('Phone number (optional)'),
  leadSource: z.string().optional().describe('Source of the lead (optional)'),
  description: z.string().optional().describe('Additional description (optional)'),
});

export function createZohoLeadTool(mcpClient: McpClient) {
  return tool(
    async (input: z.infer<typeof createZohoLeadSchema>) => {
      try {
        const result = await mcpClient.createZohoLead(input as McpToolRequest);
        return `Successfully created Zoho lead: ${JSON.stringify(result)}`;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return `Failed to create Zoho lead: ${errorMessage}`;
      }
    },
    {
      name: 'create_zoho_lead',
      description: 'Create a new lead in Zoho CRM via Zapier integration',
      schema: createZohoLeadSchema,
    }
  );
}