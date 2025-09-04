#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { MultiAgentInfraStack } from './stacks/multi-agent-infra-stack';

const app = new cdk.App();

new MultiAgentInfraStack(app, 'MultiAgentInfraStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});