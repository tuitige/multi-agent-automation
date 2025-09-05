import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class MultiAgentInfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // VPC with private subnets and NAT Gateway
    const vpc = new ec2.Vpc(this, 'MultiAgentVpc', {
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
    });

    // ECS Cluster
    const cluster = new ecs.Cluster(this, 'MultiAgentCluster', {
      vpc,
      clusterName: 'multi-agent-cluster',
      containerInsights: true,
    });

    // ECR Repositories - reference existing repositories
    const mcpServerRepo = ecr.Repository.fromRepositoryName(this, 'McpServerRepo', 'multi-agent/mcp-server');

    const agentRepo = ecr.Repository.fromRepositoryName(this, 'AgentRepo', 'multi-agent/agent-langgraph');

    // CloudWatch Log Groups
    const mcpServerLogGroup = new logs.LogGroup(this, 'McpServerLogGroup', {
      logGroupName: '/aws/ecs/mcp-server',
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const agentLogGroup = new logs.LogGroup(this, 'AgentLogGroup', {
      logGroupName: '/aws/ecs/agent-langgraph',
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Secrets Manager for sensitive configuration
    const zapierSecret = new secretsmanager.Secret(this, 'ZapierSecret', {
      secretName: 'multi-agent/zapier-config',
      description: 'Zapier webhook URL and HMAC secret',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          webhookUrl: 'https://hooks.zapier.com/hooks/catch/CHANGE_ME',
        }),
        generateStringKey: 'hmacSecret',
        excludeCharacters: '"\\/@',
      },
    });

    // Security Group for MCP Server
    const mcpServerSg = new ec2.SecurityGroup(this, 'McpServerSg', {
      vpc,
      description: 'Security group for MCP Server',
      allowAllOutbound: true,
    });

    // Security Group for Agent Service
    const agentSg = new ec2.SecurityGroup(this, 'AgentSg', {
      vpc,
      description: 'Security group for Agent Service',
      allowAllOutbound: true,
    });

    // Allow agent to communicate with MCP server
    mcpServerSg.addIngressRule(agentSg, ec2.Port.tcp(3000), 'Agent to MCP Server');

    // Task Execution Role
    const taskExecutionRole = new iam.Role(this, 'TaskExecutionRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy'),
      ],
    });

    // Grant secrets access to task execution role
    zapierSecret.grantRead(taskExecutionRole);

    // Task Role for MCP Server
    const mcpServerTaskRole = new iam.Role(this, 'McpServerTaskRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    });

    // Task Role for Agent
    const agentTaskRole = new iam.Role(this, 'AgentTaskRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    });

    // Task Definitions
    const mcpServerTaskDefinition = new ecs.FargateTaskDefinition(this, 'McpServerTaskDefinition', {
      memoryLimitMiB: 512,
      cpu: 256,
      executionRole: taskExecutionRole,
      taskRole: mcpServerTaskRole,
    });

    const mcpServerContainer = mcpServerTaskDefinition.addContainer('McpServerContainer', {
      image: ecs.ContainerImage.fromEcrRepository(mcpServerRepo, 'latest'),
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'mcp-server',
        logGroup: mcpServerLogGroup,
      }),
      environment: {
        NODE_ENV: 'production',
        PORT: '3000',
      },
      secrets: {
        ZAPIER_CONFIG: ecs.Secret.fromSecretsManager(zapierSecret),
      },
    });

    mcpServerContainer.addPortMappings({
      containerPort: 3000,
      protocol: ecs.Protocol.TCP,
    });

    const agentTaskDefinition = new ecs.FargateTaskDefinition(this, 'AgentTaskDefinition', {
      memoryLimitMiB: 1024,
      cpu: 512,
      executionRole: taskExecutionRole,
      taskRole: agentTaskRole,
    });

    const agentContainer = agentTaskDefinition.addContainer('AgentContainer', {
      image: ecs.ContainerImage.fromEcrRepository(agentRepo, 'latest'),
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'agent-langgraph',
        logGroup: agentLogGroup,
      }),
      environment: {
        NODE_ENV: 'production',
        MCP_SERVER_URL: 'http://mcp-server.local:3000',
      },
    });

    // Internal Application Load Balancer for service-to-service communication
    const internalAlb = new elbv2.ApplicationLoadBalancer(this, 'InternalAlb', {
      vpc,
      internetFacing: false,
      securityGroup: mcpServerSg,
    });

    const mcpServerTargetGroup = new elbv2.ApplicationTargetGroup(this, 'McpServerTargetGroup', {
      vpc,
      port: 3000,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targetType: elbv2.TargetType.IP,
      healthCheck: {
        path: '/health',
        healthyHttpCodes: '200',
      },
    });

    const mcpServerListener = internalAlb.addListener('McpServerListener', {
      port: 3000,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultTargetGroups: [mcpServerTargetGroup],
    });

    // ECS Services
    const mcpServerService = new ecs.FargateService(this, 'McpServerService', {
      cluster,
      taskDefinition: mcpServerTaskDefinition,
      desiredCount: 1,
      securityGroups: [mcpServerSg],
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      serviceName: 'mcp-server',
    });

    mcpServerService.attachToApplicationTargetGroup(mcpServerTargetGroup);

    const agentService = new ecs.FargateService(this, 'AgentService', {
      cluster,
      taskDefinition: agentTaskDefinition,
      desiredCount: 1,
      securityGroups: [agentSg],
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      serviceName: 'agent-langgraph',
    });

    // Outputs
    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'VPC ID',
    });

    new cdk.CfnOutput(this, 'ClusterName', {
      value: cluster.clusterName,
      description: 'ECS Cluster Name',
    });

    new cdk.CfnOutput(this, 'McpServerRepoUri', {
      value: mcpServerRepo.repositoryUri,
      description: 'MCP Server ECR Repository URI',
    });

    new cdk.CfnOutput(this, 'AgentRepoUri', {
      value: agentRepo.repositoryUri,
      description: 'Agent ECR Repository URI',
    });

    new cdk.CfnOutput(this, 'InternalAlbDns', {
      value: internalAlb.loadBalancerDnsName,
      description: 'Internal ALB DNS Name',
    });
  }
}