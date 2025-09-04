# Local Development Setup

This guide helps you set up and test the multi-agent automation system locally.

## Prerequisites

- Node.js 18+
- Docker (for containerization)
- AWS CLI configured (for deployment)

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Build all services:**
   ```bash
   npm run build
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

## Local Development

### MCP Server

The MCP Server provides tools via HTTP endpoints with HMAC authentication.

**Start in development mode:**
```bash
cd services/mcp-server
npm run dev
```

**Test the health endpoint:**
```bash
curl http://localhost:3000/health
```

**Test the create-zoho-lead tool:**
```bash
# You'll need proper HMAC signature - see below for testing without auth
curl -X POST http://localhost:3000/tools/create-zoho-lead \
  -H "Content-Type: application/json" \
  -H "X-Signature: your-hmac-signature" \
  -H "X-Timestamp: $(date +%s)000" \
  -d '{
    "firstName": "John",
    "lastName": "Doe", 
    "email": "john@example.com",
    "company": "Test Corp"
  }'
```

### Agent Service

The Agent service orchestrates multi-agent workflows using LangChain.

**Start in development mode:**
```bash
cd services/agent-langgraph
npm run dev
```

**Test via CLI:**
```bash
cd services/agent-langgraph
npm run cli execute "Create a lead for John Doe at ACME Corp with email john@acme.com"
```

**Test via HTTP API:**
```bash
curl -X POST http://localhost:3001/execute \
  -H "Content-Type: application/json" \
  -d '{"objective": "Create a lead for Jane Smith at Example Inc with email jane@example.com"}'
```

## Environment Variables

### MCP Server
- `PORT` - Server port (default: 3000)
- `HMAC_SECRET` - Secret for HMAC authentication
- `ZAPIER_WEBHOOK_URL` - Zapier catch hook URL
- `ZAPIER_HMAC_SECRET` - HMAC secret for Zapier requests

### Agent Service  
- `PORT` - Server port (default: 3001)
- `MCP_SERVER_URL` - MCP server URL (default: http://localhost:3000)
- `HMAC_SECRET` - HMAC secret for MCP communication
- `OPENAI_API_KEY` - OpenAI API key for LangChain

## Testing Without HMAC (Development Only)

For local testing, you can temporarily disable HMAC authentication:

1. Comment out the HMAC middleware in `services/mcp-server/src/server.ts`:
   ```typescript
   // app.use('/tools', hmacAuthMiddleware);
   ```

2. Restart the MCP server and test without authentication headers.

## Docker Development

Build and run services in Docker:

```bash
# Build MCP Server
cd services/mcp-server
npm run build
docker build -t mcp-server .
docker run -p 3000:3000 -e HMAC_SECRET=dev-secret mcp-server

# Build Agent Service  
cd services/agent-langgraph
npm run build
docker build -t agent-langgraph .
docker run -p 3001:3001 -e MCP_SERVER_URL=http://host.docker.internal:3000 agent-langgraph
```

## Zapier Integration Setup

1. Create a new Zap in Zapier
2. Add a "Catch Hook" trigger to get a webhook URL
3. Set the webhook URL in your environment variables
4. Configure the hook to create leads in Zoho CRM
5. Test the integration using the MCP server endpoint

## Common Issues

### Port Conflicts
If ports 3000 or 3001 are in use, update the PORT environment variable.

### HMAC Authentication Errors
Ensure timestamps are recent (within 5 minutes) and signatures are correctly calculated.

### LangChain API Errors
Verify your OpenAI API key is valid and has sufficient credits.

## CI/CD Workflow

The repository includes a complete CI/CD pipeline via GitHub Actions:

### Workflow Triggers:
- **Push to main/develop**: Full CI pipeline with deployment
- **Pull requests to main**: CI validation only

### Pipeline Steps:
1. **Test & Lint**: Runs `npm ci`, `npm run lint`, `npm run build`, and `npm test`
2. **CDK Synth**: Validates infrastructure code and uploads CloudFormation templates
3. **Docker Build**: Builds and pushes service images to ECR
4. **Deploy Infrastructure**: Deploys AWS resources with manual approval
5. **Deploy Services**: Updates ECS services with manual approval

### Setup Requirements:
```bash
# Required GitHub Secrets:
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_ACCOUNT_ID=your-account-id

# GitHub Environment: 
# Create "production" environment with protection rules for manual approval
```

### Local Testing of CI Steps:
```bash
# Test the full CI pipeline locally
npm ci
npm run lint
npm run build
npm test

# Test Docker builds (requires package-lock.json copy)
cp package-lock.json services/agent-langgraph/
cd services/agent-langgraph && docker build -t test-image .

# Test CDK synth
cd infra
npm ci
npm run synth
```

## Next Steps

1. Deploy infrastructure: `npm run deploy:infra`
2. Set up GitHub environments and protection rules
3. Configure AWS secrets in GitHub repository settings
4. Set up monitoring and logging