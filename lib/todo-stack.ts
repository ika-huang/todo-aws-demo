import * as cdk from 'aws-cdk-lib';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import { UserPool } from 'aws-cdk-lib/aws-cognito';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import {
  RestApi,
  LambdaIntegration,
  CognitoUserPoolsAuthorizer,
  AuthorizationType,
} from 'aws-cdk-lib/aws-apigateway';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

interface TodoStackProps extends cdk.StackProps {
  todoTable: Table;
  userPool: UserPool;
}

export class TodoStack extends cdk.Stack {
  public readonly todoApi: RestApi;
  
  constructor(scope: Construct, id: string, props: TodoStackProps) {
    super(scope, id, props);

    const { todoTable, userPool } = props;

    // lambda
    const createTodoLambda = new NodejsFunction(this, 'CreateTodoLambda', {
      runtime: Runtime.NODEJS_20_X,
      entry: 'lambda/todos/create-todo.ts',
      handler: 'main',
      environment: {
        TODO_TABLE_NAME: todoTable.tableName,
      },
      initialPolicy: [
        new PolicyStatement({
          actions: [
            'dynamodb:PutItem',
          ],
          resources: [
            '*'
          ]
        })
      ],
    });

    const listTodoLambda = new NodejsFunction(this, 'listTodoLambda', {
      runtime: Runtime.NODEJS_20_X,
      entry: 'lambda/todos/list-todo.ts',
      handler: 'main',
      environment: {
        TODO_TABLE_NAME: todoTable.tableName,
      },
      initialPolicy: [
        new PolicyStatement({
          actions: [
            'dynamodb:Query',
          ],
          resources: [
            '*'
          ]
        })
      ]
    });

    const getTodoLambda = new NodejsFunction(this, 'getTodoLambda', {
      runtime: Runtime.NODEJS_20_X,
      entry: 'lambda/todos/get-todo.ts',
      handler: 'main',
      environment: {
        TODO_TABLE_NAME: todoTable.tableName,
      },
      initialPolicy: [
        new PolicyStatement({
          actions: [
            'dynamodb:GetItem',
          ],
          resources: [
            '*'
          ]
        })
      ]
    });

    const updateTodoLambda = new NodejsFunction(this, 'updateTodoLambda', {
      runtime: Runtime.NODEJS_20_X,
      entry: 'lambda/todos/update-todo.ts',
      handler: 'main',
      environment: {
        TODO_TABLE_NAME: todoTable.tableName,
      },
      initialPolicy: [
        new PolicyStatement({
          actions: [
            'dynamodb:GetItem',
            'dynamodb:UpdateItem',
          ],
          resources: [
            '*'
          ]
        })
      ]
    });

    const deleteTodoLambda = new NodejsFunction(this, 'deleteTodoLambda', {
      runtime: Runtime.NODEJS_20_X,
      entry: 'lambda/todos/delete-todo.ts',
      handler: 'main',
      environment: {
        TODO_TABLE_NAME: todoTable.tableName,
      },
      initialPolicy: [
        new PolicyStatement({
          actions: [
            'dynamodb:GetItem',
            'dynamodb:DeleteItem',
          ],
          resources: [
            '*'
          ]
        })
      ]
    });

    // authorization
    const authorizer = new CognitoUserPoolsAuthorizer(this, 'TodoAuthorizer', {
      cognitoUserPools: [
        userPool,
      ],
    });

    // apigateway
    this.todoApi = new RestApi(this, 'TodoApi', {
      restApiName: `${process.env.APP_STACK_NAME}-TodoService`,
    });

    const todosResource = this.todoApi.root.addResource('todos');
    const todoResource = todosResource.addResource('{todoId}');
    todosResource.addMethod(
      'POST',
      new LambdaIntegration(createTodoLambda), {
        authorizer,
        authorizationType: AuthorizationType.COGNITO,
      },
    );
    todosResource.addMethod(
      'GET',
      new LambdaIntegration(listTodoLambda), {
        authorizer,
        authorizationType: AuthorizationType.COGNITO,
      },
    );
    todoResource.addMethod(
      'GET',
      new LambdaIntegration(getTodoLambda), {
        authorizer,
        authorizationType: AuthorizationType.COGNITO,
      },
    );
    todoResource.addMethod(
      'PUT',
      new LambdaIntegration(updateTodoLambda), {
        authorizer,
        authorizationType: AuthorizationType.COGNITO,
      },
    );
    todoResource.addMethod(
      'DELETE',
      new LambdaIntegration(deleteTodoLambda), {
        authorizer,
        authorizationType: AuthorizationType.COGNITO,
      },
    );

    new cdk.CfnOutput(this, 'TodoApiUrl', {
      value: this.todoApi.url,
    });
  }
}
