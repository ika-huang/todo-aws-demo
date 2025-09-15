import * as cdk from 'aws-cdk-lib';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import {
  RestApi,
  LambdaIntegration,
} from 'aws-cdk-lib/aws-apigateway';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

interface TodoStackProps extends cdk.StackProps {
  todoTable: Table;
  todoApi: RestApi;
}

export class TodoStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TodoStackProps) {
    super(scope, id, props);

    const { todoTable, todoApi } = props;

    // lambda
    const createTodoLambda = new NodejsFunction(this, 'CreateTodoLambda', {
      runtime: Runtime.NODEJS_20_X,
      entry: 'lambda/todos/create-todo.ts',
      handler: 'main',
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

    // apigateway
    const todoResource = todoApi.root.addResource('todos');
    const todoUserResource = todoResource.addResource('{todoId}').addResource('user').addResource('{userId}');
    todoResource.addMethod(
      'POST',
      new LambdaIntegration(createTodoLambda),
    );
    todoResource.addResource('user').addResource('{userId}').addMethod(
      'GET',
      new LambdaIntegration(listTodoLambda),
    );
    todoUserResource.addMethod(
      'GET',
      new LambdaIntegration(getTodoLambda),
    );
    todoUserResource.addMethod(
      'PUT',
      new LambdaIntegration(updateTodoLambda),
    );
    todoUserResource.addMethod(
      'DELETE',
      new LambdaIntegration(deleteTodoLambda),
    );
  }
}
