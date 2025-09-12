#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
// import { TodoAwsDemoStack } from '../lib/todo-aws-demo-stack';
import * as dotenv from 'dotenv';
import { libStack } from '../lib';

dotenv.config();

const app = new cdk.App();

const databaseStack = new libStack.DatabaseStack(app, 'DatabaseStack');
const apiGatewayStack = new libStack.ApiGatewayStack(app, 'ApiGatewayStack');

new libStack.TodoStack(app, 'TodoStack', {
  todoTable: databaseStack.todoTable,
  todoApi: apiGatewayStack.todoApi,
  /* If you don't specify 'env', this stack will be environment-agnostic.
   * Account/Region-dependent features and context lookups will not work,
   * but a single synthesized template can be deployed anywhere. */

  /* Uncomment the next line to specialize this stack for the AWS Account
   * and Region that are implied by the current CLI configuration. */
  // env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },

  /* Uncomment the next line if you know exactly what Account and Region you
   * want to deploy the stack to. */
  // env: { account: '123456789012', region: 'us-east-1' },

  /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
});
new libStack.AuthStack(app, 'AuthStack', {
  userTable: databaseStack.userTable,
  authApi: apiGatewayStack.authApi,
});
new libStack.CommentStack(app, 'CommentStack', {
  commentTable: databaseStack.commentTable,
  todoTable: databaseStack.todoTable,
  commentApi: apiGatewayStack.commentApi,
});
