### Issue: Ensure ECS Services Exist

Ensure ECS services (`mcp-server-service` and `agent-langgraph-service`) in cluster `multi-agent-cluster` are created unless they already exist. This is to prevent `ServiceNotFoundException` errors during deployment.

#### Clarification Needed:
1. Is this a misconfiguration of our CDK setup?
2. ECS services should not be recreated every time we run `cdk deploy`—they should only be created if the stack is new or if the ECS cluster/service definition changes, not on every deploy.

#### Guidance Needed:
Provide guidance on proper CDK setup to ensure ECS service persistence.