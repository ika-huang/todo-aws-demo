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

interface CommentStackProps extends cdk.StackProps {
  commentTable: Table;
  todoTable: Table;
  commentApi: RestApi;
}

export class CommentStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: CommentStackProps) {
    super(scope, id, props);

    const { commentTable, todoTable, commentApi } = props;

    // lambda
    const createCommentLambda = new NodejsFunction(this, 'CreateCommentLambda', {
      runtime: Runtime.NODEJS_20_X,
      entry: 'lambda/comments/create-comment.ts',
      handler: 'main',
      environment: {
        TODO_TABLE_NAME: todoTable.tableName,
        COMMENT_TABLE_NAME: commentTable.tableName,
      },
      initialPolicy: [
        new PolicyStatement({
          actions: [
            'dynamodb:GetItem',
            'dynamodb:PutItem',
          ],
          resources: [
            '*'
          ]
        })
      ]
    });
    const listCommentLambda = new NodejsFunction(this, 'ListCommentLambda', {
      runtime: Runtime.NODEJS_20_X,
      entry: 'lambda/comments/list-comment.ts',
      handler: 'main',
      environment: {
        TODO_TABLE_NAME: todoTable.tableName,
        COMMENT_TABLE_NAME: commentTable.tableName,
      },
      initialPolicy: [
        new PolicyStatement({
          actions: [
            'dynamodb:GetItem',
            'dynamodb:Query',
          ],
          resources: [
            '*'
          ]
        })
      ]
    });
    
    // apigateway
    const commentResource = commentApi.root.addResource('comments');
    const commentTodoResource = commentResource.addResource('todos').addResource('{todoId}');
    const commentTodoUserResource = commentTodoResource.addResource('user').addResource('{userId}');
    commentTodoUserResource.addMethod(
      'POST',
      new LambdaIntegration(createCommentLambda),
    );
    commentTodoUserResource.addMethod(
      'GET',
      new LambdaIntegration(listCommentLambda),
    );
  }
}
