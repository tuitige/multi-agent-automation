# Multi-Agent Automation System

**ALWAYS follow these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.**

Production-grade multi-agent automation system built with LangGraph agents and MCP Server tools on Node.js/TypeScript, deployed to AWS Fargate.

## Working Effectively

### Bootstrap the Repository
```bash
npm install                    # Install all dependencies - takes ~20 seconds
npm run build                  # Build all services - takes ~7 seconds. NEVER CANCEL.
npm run lint                   # Lint all services - takes ~2 seconds. NEVER CANCEL.
```

### Run Tests
Tests use Jest + ts-jest configuration (already configured in services):
```bash
cd services/mcp-server && npx jest         # Takes ~3 seconds. NEVER CANCEL.
cd services/agent-langgraph && npx jest    # Takes ~3 seconds. NEVER CANCEL.
```

**Note**: If `jest.config.js` doesn't exist in a service directory, create it with:
```bash
npx ts-jest config:init
```

### Start Development Services
The system runs two services that must both be running for full functionality:

**MCP Server (Port 3000) - HTTP Tool Provider:**
```bash
cd services/mcp-server
npm run dev                    # Starts in ~5 seconds
```

**Agent Service (Port 3001) - LangGraph Multi-Agent System:**
```bash
cd services/agent-langgraph  
npm run dev                    # Starts in ~5 seconds
```

### Validate Services Are Running
```bash
curl http://localhost:3000/health         # MCP Server health check
curl http://localhost:3001/health         # Agent Service health check
npm run cli health                        # CLI health check (from agent-langgraph/)
```

## Manual Validation Scenarios

**ALWAYS manually validate functionality after making changes:**

### Basic Service Integration
```bash
cd services/agent-langgraph
npm run cli health
# Expected: "✅ MCP Server is healthy: { status: 'healthy', timestamp: '...' }"
```

### MCP Tool Testing (Without HMAC)
For development testing, temporarily disable HMAC authentication:

1. Edit `services/mcp-server/src/server.ts` and comment out:
   ```typescript
   // app.use('/tools', hmacAuthMiddleware);
   ```

2. Test the create-zoho-lead tool:
   ```bash
   curl -X POST http://localhost:3000/tools/create-zoho-lead \
     -H "Content-Type: application/json" \
     -d '{"firstName": "John", "lastName": "Doe", "email": "john@example.com", "company": "Test Corp"}'
   # Expected: {"error":"Zapier configuration not available"} (normal without Zapier setup)
   ```

3. **IMPORTANT**: Re-enable HMAC authentication after testing.

### Full Agent Workflow (Requires OpenAI API Key)
```bash
cd services/agent-langgraph
OPENAI_API_KEY=your_key npm run cli execute "Create a lead for John Doe at ACME Corp with email john@acme.com"
# Expected: Full workflow execution with plan and results
```

## Environment Variables

**Required for development:**
```bash
cp .env.example .env.local
```

**Critical variables:**
- `OPENAI_API_KEY` - Required for agent execution (will fail without it)
- `HMAC_SECRET` - For MCP server authentication
- `ZAPIER_WEBHOOK_URL` - For actual Zoho lead creation
- `ZAPIER_HMAC_SECRET` - For Zapier integration

**Port configuration:**
- `PORT=3000` (MCP Server)
- `PORT=3001` (Agent Service)

## Common Issues & Solutions

### Port Conflicts
If ports 3000 or 3001 are in use:
```bash
# Check what's using the ports
lsof -i :3000
lsof -i :3001
# Update PORT environment variable if needed
```

### OpenAI API Errors
- **Error**: `APIConnectionError: Connection error` 
- **Solution**: Ensure `OPENAI_API_KEY` is valid and has sufficient credits
- **Testing**: Use `npm run cli health` for service connectivity without API calls

### HMAC Authentication Errors
- **Error**: Authentication failures on `/tools/*` endpoints
- **Solution**: Ensure timestamps are recent (within 5 minutes) and signatures are correctly calculated
- **Development**: Temporarily disable HMAC middleware for local testing

### Test Configuration Issues
- **Error**: `Cannot use import statement outside a module`
- **Solution**: Run `npx ts-jest config:init` in each service directory

## Build Times & Timeouts

**All operations are fast - use standard timeouts:**
- Dependencies: 20 seconds
- Build: 7 seconds 
- Lint: 2 seconds
- Tests: 3 seconds per service
- Service startup: 5 seconds each

**NEVER CANCEL these operations** - they complete quickly.

## Architecture Overview

```
├── infra/                    # AWS CDK infrastructure (port N/A)
├── services/
│   ├── agent-langgraph/      # LangGraph multi-agent service (port 3001)
│   └── mcp-server/           # MCP server with tool implementations (port 3000)
├── .github/workflows/        # CI/CD pipelines
└── README.md
```

### Key Components

**MCP Server (`services/mcp-server/`):**
- HTTP-based tool provider with HMAC authentication
- Key tool: `create-zoho-lead` - Creates leads via Zapier webhook
- JSON schema validation using Zod
- Health endpoint: `/health`

**Agent Service (`services/agent-langgraph/`):**
- LangGraph-powered multi-agent system
- CLI interface: `npm run cli`
- HTTP API on port 3001
- Integrates with MCP server for tool execution

**Infrastructure (`infra/`):**
- AWS CDK setup for production deployment
- ECS Fargate, VPC, ALB, ECR repositories
- Deploy with: `npm run deploy:infra`

## File Locations & Navigation

**Frequently modified files:**
- `services/mcp-server/src/tools/` - Tool implementations
- `services/agent-langgraph/src/agents/` - Agent definitions  
- `services/agent-langgraph/src/workflow.ts` - Main workflow orchestration
- `.env.local` - Environment configuration

**Configuration files:**
- `package.json` - Root workspace configuration
- `services/*/package.json` - Service-specific dependencies
- `tsconfig.json` - TypeScript configuration
- `jest.config.js` - Test configuration (per service)

**CI/CD validation:**
Always run before committing:
```bash
npm run lint                   # Will fail CI if not passing
npm run build                  # Will fail CI if not passing  
npm test                       # Currently minimal tests
```

## Deployment

**Infrastructure deployment:**
```bash
cd infra
npm ci
npm run deploy                 # Deploys AWS infrastructure
```

**Service deployment:**
```bash
npm run deploy:services        # Builds and pushes Docker images
```

**Prerequisites for deployment:**
- AWS CLI configured
- Docker installed
- Valid AWS credentials with appropriate permissions

## Tips for Development

- Always start both services (MCP server + Agent service) for full functionality
- Use CLI interface for quick testing: `npm run cli health`
- Disable HMAC authentication temporarily for tool testing
- Check service logs if endpoints don't respond
- Port conflicts are common - check with `lsof -i :3000` and `lsof -i :3001`
- OpenAI API key is required only for full agent execution, not for service health checks