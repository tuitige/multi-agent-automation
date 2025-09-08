# Multi-Agent Automation Architecture

Production-grade multi-agent architecture on AWS Fargate showcasing LangGraph agents with MCP Server tools integration.

## Architecture Overview

This project demonstrates a minimal, production-lean architecture with:

- **LangGraph Multi-Agent Service**: TypeScript-based agent orchestration running on ECS Fargate
- **MCP Server**: Tool provider service exposing capabilities to external automations  
- **AWS Infrastructure**: CDK-managed VPC, private subnets, ECS cluster, and supporting services
- **Zapier Integration**: First tool implementation for Zoho lead creation (n8n-ready)

## Project Structure

```
├── infra/                    # AWS CDK infrastructure
├── services/
│   ├── agent-langgraph/      # LangGraph multi-agent service
│   └── mcp-server/           # MCP server with tool implementations
├── .github/workflows/        # CI/CD pipelines
└── README.md
```

## Quick Start

### Prerequisites

- Node.js 18+
- AWS CLI configured
- Docker installed

### Installation

```bash
# Install dependencies
npm install

# Deploy infrastructure
npm run deploy:infra

# Build and deploy services
npm run deploy:services
```

## Services

### MCP Server (`services/mcp-server/`)

HTTP-based tool provider with:
- HMAC-authenticated endpoints
- JSON schema validation
- Zapier webhook integration
- Ready for n8n migration

**Key Tool**: `create_zoho_lead` - Creates leads via Zapier catch hook

### Agent Service (`services/agent-langgraph/`)

LangGraph-powered multi-agent system featuring:
- Agent planner and executor
- MCP tool client integration
- CLI and HTTP interfaces

## Infrastructure (`infra/`)

AWS CDK setup providing:
- VPC with private subnets and NAT Gateway
- ECS Fargate cluster
- ECR repositories for container images
- Application Load Balancer for internal communication
- CloudWatch logging and AWS Secrets Manager
- Security groups and IAM roles

## Cost Allocation Tags

All AWS resources are automatically tagged with cost allocation tags for easy cost analysis and optimization:

- `Project`: "multi-agent-automation"
- `Repo`: "tuitige/multi-agent-automation"  
- `Stack`: Stack name (e.g., "MultiAgentInfraStack")

### Using AWS Cost Explorer

To analyze costs by tags:

1. **Activate Cost Allocation Tags** in AWS Billing Console:
   - Navigate to AWS Billing → Cost allocation tags
   - Search for and activate the tags: `Project`, `Repo`, and `Stack`
   - Note: It takes up to 24 hours for tags to appear after activation

2. **View Costs in Cost Explorer**:
   - Go to AWS Cost Management → Cost Explorer
   - Create a new report or use existing ones
   - Group by: Choose one of your activated tags (`Project`, `Repo`, or `Stack`)
   - Filter by: Use specific tag values to focus on this project

3. **Example Queries**:
   - **Project costs**: Group by `Project` tag, filter by `Project=multi-agent-automation`
   - **Stack breakdown**: Group by `Stack` tag, filter by `Project=multi-agent-automation`
   - **Multi-repo comparison**: Group by `Repo` tag (if you have multiple repos)

### Tagging Best Practices

- **Consistent naming**: Use kebab-case for tag values
- **Required tags**: All stacks should include Project, Repo, and Stack tags
- **Additional tags**: Consider adding Environment (dev/staging/prod), Owner, or Department tags as needed
- **Tag governance**: Use AWS Config rules or CDK Aspects to enforce tagging standards

## CI/CD Pipeline

Automated GitHub Actions workflow for monorepo deployment:

### On Push to Main Branch:
1. **Test & Lint**: Validates code quality across all services
2. **CDK Synth**: Generates and validates CloudFormation templates
3. **Build & Push**: Creates Docker images and pushes to ECR
4. **Deploy Infrastructure**: Deploys AWS resources via CDK (with manual approval)
5. **Deploy Services**: Updates ECS services with new images (with manual approval)

### Manual Approval Gates:
- Production environment protection requires manual approval for:
  - Infrastructure deployments
  - Service deployments

### Requirements:
- GitHub Secrets: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_ACCOUNT_ID`
- GitHub Environment: `production` (configure with protection rules for manual approval)

## Development

```bash
# Run tests
npm test

# Lint code
npm run lint

# Build all services
npm run build
```

## Security

- Services run in private subnets behind NAT Gateway
- HMAC authentication for tool endpoints
- IAM role-based permissions
- IP allowlist configuration

## Migration to n8n

The architecture is designed for easy migration from Zapier to self-hosted n8n:

1. Replace Zapier webhooks with n8n endpoints
2. Deploy n8n in the same VPC (Fargate or EC2)
3. Update MCP server configuration
4. Eliminate public egress requirements

## Next Steps

- Add more tool implementations
- Enhanced observability and monitoring
- Zero-egress network posture
- Advanced multi-agent workflows

---

*This project serves as a foundation for production multi-agent automation systems.*