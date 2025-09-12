import * as cdk from 'aws-cdk-lib';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import {
  Function,
  Runtime,
  Code,
} from 'aws-cdk-lib/aws-lambda';
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
    const createTodoLambda = new Function(this, 'CreateTodoLambda', {
      runtime: Runtime.NODEJS_20_X,
      code: Code.fromAsset('lambda/todos'),
      handler: 'create-todo.main',
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
      ]
    });

    const listTodoLambda = new Function(this, 'listTodoLambda', {
      runtime: Runtime.NODEJS_20_X,
      code: Code.fromAsset('lambda/todos'),
      handler: 'list-todo.main',
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

    const getTodoLambda = new Function(this, 'getTodoLambda', {
      runtime: Runtime.NODEJS_20_X,
      code: Code.fromAsset('lambda/todos'),
      handler: 'get-todo.main',
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

    const updateTodoLambda = new Function(this, 'updateTodoLambda', {
      runtime: Runtime.NODEJS_20_X,
      code: Code.fromAsset('lambda/todos'),
      handler: 'update-todo.main',
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

    const deleteTodoLambda = new Function(this, 'deleteTodoLambda', {
      runtime: Runtime.NODEJS_20_X,
      code: Code.fromAsset('lambda/todos'),
      handler: 'delete-todo.main',
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
