import { ChatOpenAI } from '@langchain/openai';
import { AgentExecutor, createOpenAIToolsAgent } from 'langchain/agents';
import { ChatPromptTemplate } from '@langchain/core/prompts';

export class ExecutorAgent {
  private llm: ChatOpenAI;
  private executor: AgentExecutor;

  constructor(tools: any[]) {
    this.llm = new ChatOpenAI({
      model: 'gpt-3.5-turbo',
      temperature: 0,
    });

    const prompt = ChatPromptTemplate.fromMessages([
      ['system', `You are an execution agent that carries out specific tasks using available tools.
You should execute tasks precisely and report the results clearly.

Always use the appropriate tool when available rather than trying to simulate the action.`],
      ['human', '{input}'],
      ['placeholder', '{agent_scratchpad}'],
    ]);

    const agent = createOpenAIToolsAgent({
      llm: this.llm,
      tools,
      prompt,
    });

    this.executor = new AgentExecutor({
      agent,
      tools,
      verbose: true,
    });
  }

  async execute(task: string): Promise<string> {
    try {
      const result = await this.executor.invoke({
        input: task,
      });

      return result.output;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return `Failed to execute task: ${errorMessage}`;
    }
  }
}