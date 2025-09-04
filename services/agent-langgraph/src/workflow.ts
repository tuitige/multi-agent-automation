import { StateGraph, END } from 'langgraph';
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
  private graph: StateGraph<WorkflowState>;

  constructor(mcpServerUrl: string, hmacSecret: string) {
    const mcpClient = new McpClient(mcpServerUrl, hmacSecret);
    this.planner = new PlannerAgent(mcpClient);
    this.executor = new ExecutorAgent(this.planner.getTools());

    this.graph = new StateGraph<WorkflowState>({
      channels: {
        objective: null,
        plan: null,
        currentStep: null,
        results: null,
        completed: null,
      },
    });

    this.setupGraph();
  }

  private setupGraph(): void {
    // Planning node
    this.graph.addNode('planner', async (state: WorkflowState): Promise<Partial<WorkflowState>> => {
      console.log(`Planning for objective: ${state.objective}`);
      const plan = await this.planner.plan(state.objective);
      return {
        plan,
        currentStep: 0,
        results: [],
        completed: false,
      };
    });

    // Execution node
    this.graph.addNode('executor', async (state: WorkflowState): Promise<Partial<WorkflowState>> => {
      const { plan, currentStep, results } = state;
      
      if (currentStep >= plan.length) {
        return { completed: true };
      }

      const task = plan[currentStep];
      console.log(`Executing step ${currentStep + 1}: ${task}`);
      
      const result = await this.executor.execute(task);
      const newResults = [...results, result];

      return {
        results: newResults,
        currentStep: currentStep + 1,
      };
    });

    // Conditional routing
    this.graph.addConditionalEdges(
      'executor',
      (state: WorkflowState) => {
        return state.currentStep >= state.plan.length ? 'end' : 'executor';
      },
      {
        executor: 'executor',
        end: END,
      }
    );

    // Set entry point and edges
    this.graph.setEntryPoint('planner');
    this.graph.addEdge('planner', 'executor');

    this.graph = this.graph.compile();
  }

  async run(objective: string): Promise<WorkflowState> {
    const initialState: WorkflowState = {
      objective,
      plan: [],
      currentStep: 0,
      results: [],
      completed: false,
    };

    const finalState = await this.graph.invoke(initialState);
    return finalState;
  }
}