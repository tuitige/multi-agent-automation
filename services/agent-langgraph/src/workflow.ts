import { PlannerAgent } from './agents/planner';
import { ExecutorAgent } from './agents/executor';
import { McpClient } from './tools/mcp-client';

interface WorkflowState {
  objective: string;
  plan: string[];
  currentStep: number;
  results: string[];
  completed: boolean;
}

export class MultiAgentWorkflow {
  private planner: PlannerAgent;
  private executor: ExecutorAgent;

  constructor(mcpServerUrl: string, hmacSecret: string) {
    const mcpClient = new McpClient(mcpServerUrl, hmacSecret);
    this.planner = new PlannerAgent(mcpClient);
    this.executor = new ExecutorAgent(this.planner.getTools());
  }

  async run(objective: string): Promise<WorkflowState> {
    console.log(`Starting workflow for objective: ${objective}`);

    // Planning phase
    console.log('Planning phase...');
    const plan = await this.planner.plan(objective);
    
    const state: WorkflowState = {
      objective,
      plan,
      currentStep: 0,
      results: [],
      completed: false,
    };

    console.log(`Generated plan with ${plan.length} steps:`, plan);

    // Execution phase
    console.log('Execution phase...');
    for (let i = 0; i < plan.length; i++) {
      const task = plan[i];
      console.log(`Executing step ${i + 1}: ${task}`);
      
      try {
        const result = await this.executor.execute(task);
        state.results.push(result);
        state.currentStep = i + 1;
        
        console.log(`Step ${i + 1} completed: ${result}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        state.results.push(`Error: ${errorMessage}`);
        console.error(`Step ${i + 1} failed:`, errorMessage);
      }
    }

    state.completed = true;
    console.log('Workflow completed');

    return state;
  }
}