import express from 'express';
import { MultiAgentWorkflow } from './workflow';

const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Execute workflow endpoint
app.post('/execute', async (req, res) => {
  try {
    const { objective } = req.body;
    
    if (!objective) {
      return res.status(400).json({ error: 'Objective is required' });
    }

    const mcpServerUrl = process.env.MCP_SERVER_URL || 'http://localhost:3000';
    const hmacSecret = process.env.HMAC_SECRET || 'default-secret';

    const workflow = new MultiAgentWorkflow(mcpServerUrl, hmacSecret);
    const result = await workflow.run(objective);

    res.json({
      success: true,
      objective,
      plan: result.plan,
      results: result.results,
      completed: result.completed,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Workflow execution error:', error);
    res.status(500).json({
      error: 'Workflow execution failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.listen(port, () => {
  console.log(`Agent service running on port ${port}`);
});