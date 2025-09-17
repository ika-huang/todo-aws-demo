import * as cdk from 'aws-cdk-lib';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import { UserPool } from 'aws-cdk-lib/aws-cognito';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import {
  RestApi,
  Cors,
  LambdaIntegration,
  CognitoUserPoolsAuthorizer,
  AuthorizationType,
} from 'aws-cdk-lib/aws-apigateway';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

interface CommentStackProps extends cdk.StackProps {
  commentTable: Table;
  todoTable: Table;
  userPool: UserPool;
}

export class CommentStack extends cdk.Stack {
  public readonly commentApi: RestApi;

  constructor(scope: Construct, id: string, props: CommentStackProps) {
    super(scope, id, props);

    const { commentTable, todoTable, userPool } = props;

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
    
    // authorization
    const authorizer = new CognitoUserPoolsAuthorizer(this, 'CommentAuthorizer', {
      cognitoUserPools: [
        userPool,
      ],
    });

    // apigateway
    this.commentApi = new RestApi(this, 'CommentApi', {
      restApiName: `${process.env.APP_STACK_NAME}-CommentService`,
      defaultCorsPreflightOptions: {
        allowOrigins: Cors.ALL_ORIGINS,
        allowMethods: Cors.ALL_METHODS,
        allowHeaders: Cors.DEFAULT_HEADERS,
      },
    });
    const commentResource = this.commentApi.root.addResource('comments');
    const commentTodoResource = commentResource.addResource('todos').addResource('{todoId}');
    commentTodoResource.addMethod(
      'POST',
      new LambdaIntegration(createCommentLambda), {
        authorizer,
        authorizationType: AuthorizationType.COGNITO,
      },
    );
    commentTodoResource.addMethod(
      'GET',
      new LambdaIntegration(listCommentLambda), {
        authorizer,
        authorizationType: AuthorizationType.COGNITO,
      },
    );

    new cdk.CfnOutput(this, 'CommentApiUrl', {
      value: this.commentApi.url,
    });
  }
}
