#!/usr/bin/env node
import { Command } from 'commander';
import { MultiAgentWorkflow } from './workflow';

const program = new Command();

program
  .name('agent-cli')
  .description('CLI for multi-agent automation workflows')
  .version('0.1.0');

program
  .command('execute')
  .description('Execute a workflow with the given objective')
  .argument('<objective>', 'The objective to achieve')
  .option('-s, --server <url>', 'MCP server URL', process.env.MCP_SERVER_URL || 'http://localhost:3000')
  .option('-k, --key <secret>', 'HMAC secret key', process.env.HMAC_SECRET || 'default-secret')
  .action(async (objective: string, options) => {
    try {
      console.log(`Executing objective: ${objective}`);
      console.log(`MCP Server: ${options.server}`);
      
      const workflow = new MultiAgentWorkflow(options.server, options.key);
      const result = await workflow.run(objective);

      console.log('\n✅ Workflow completed!');
      console.log('\n📋 Plan:');
      result.plan.forEach((step, index) => {
        console.log(`  ${index + 1}. ${step}`);
      });

      console.log('\n🔄 Results:');
      result.results.forEach((result, index) => {
        console.log(`  ${index + 1}. ${result}`);
      });

    } catch (error) {
      console.error('❌ Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program
  .command('health')
  .description('Check health of MCP server')
  .option('-s, --server <url>', 'MCP server URL', process.env.MCP_SERVER_URL || 'http://localhost:3000')
  .action(async (options) => {
    try {
      const axios = await import('axios');
      const response = await axios.default.get(`${options.server}/health`);
      console.log('✅ MCP Server is healthy:', response.data);
    } catch (error) {
      console.error('❌ MCP Server health check failed:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program.parse();