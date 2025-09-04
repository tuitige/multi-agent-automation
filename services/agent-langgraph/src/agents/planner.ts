import { ChatOpenAI } from '@langchain/openai';
import { createZohoLeadTool } from '../tools/zoho-lead';
import { McpClient } from '../tools/mcp-client';

export class PlannerAgent {
  private llm: ChatOpenAI;
  private tools: any[];

  constructor(mcpClient: McpClient) {
    this.llm = new ChatOpenAI({
      model: 'gpt-3.5-turbo',
      temperature: 0,
    });

    this.tools = [
      createZohoLeadTool(mcpClient),
    ];
  }

  async plan(objective: string): Promise<string[]> {
    const prompt = `
You are a planning agent for business automation tasks. 
Given an objective, break it down into actionable steps.

Available tools:
- create_zoho_lead: Create a new lead in Zoho CRM

Objective: ${objective}

Please provide a step-by-step plan as a JSON array of strings.
Each step should be clear and actionable.
`;

    try {
      const response = await this.llm.invoke(prompt);
      
      // Extract JSON from response
      const content = response.content as string;
      const jsonMatch = content.match(/\[[\s\S]*?\]/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // Fallback: split by lines and clean up
      return content
        .split('\n')
        .filter(line => line.trim().length > 0)
        .map(line => line.replace(/^\d+\.\s*/, '').trim());
        
    } catch (error) {
      console.error('Planning error:', error);
      return [`Execute objective: ${objective}`];
    }
  }

  getTools(): any[] {
    return this.tools;
  }
}