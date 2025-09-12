import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class TodoAwsDemoStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const userPool = new cognito.UserPool(this, 'TodosUserPool', {
      userPoolName: `${process.env.APP_STACK_NAME}-TodosUserPool`,
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
      },
      autoVerify: {
        email: true,
      },
    });

    const userPoolClient = new cognito.UserPoolClient(this, 'TodosUserPoolClient', {
      userPool: userPool,
      authFlows: {
        userPassword: true,
      },
    })

    const usersTable = new dynamodb.Table(this, 'UserTable', {
      partitionKey: {
        name: 'userId',
        type: dynamodb.AttributeType.STRING
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      tableName: `${process.env.APP_STACK_NAME}-Users`,
    });

    const todosTable = new dynamodb.Table(this, 'TodosTable', {
      partitionKey: {
        name: 'todoId',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'userId',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      tableName: `${process.env.APP_STACK_NAME}-Todos`,
    });

    todosTable.addGlobalSecondaryIndex({
      indexName: 'query-by-user-id',
      partitionKey: {
        name: 'userId',
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    })

    const commentsTable = new dynamodb.Table(this, 'CommentsTable', {
      partitionKey: {
        name: 'commentId',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'todoId',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      tableName: `${process.env.APP_STACK_NAME}-Comments`,
    });

    const registerLambda = new lambda.Function(this, 'RegisterLambda', {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset('lambda/auth'),
      handler: 'register.main',
      environment: {
        USER_POOL_ID: userPool.userPoolId,
        CLIENT_ID: userPoolClient.userPoolClientId,
      },
      initialPolicy: [
        new iam.PolicyStatement({
          actions: [
            'cognito-idp:SignUp',
          ],
          resources: [
            userPool.userPoolArn,
          ]
        }),
      ],
    });

    const loginLambda = new lambda.Function(this, 'LoginLambda', {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset('lambda/auth'),
      handler: 'login.main',
      environment: {
        USER_POOL_ID: userPool.userPoolId,
        CLIENT_ID: userPoolClient.userPoolClientId,
      },
      initialPolicy: [
        new iam.PolicyStatement({
          actions: [
            'cognito-idp:InitiateAuth',
          ],
          resources: [
            '*'
          ]
        })
      ]
    });

    const createTodoLambda = new lambda.Function(this, 'CreateTodoLambda', {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset('lambda/todos'),
      handler: 'create-todo.main',
      environment: {
        TODO_TABLE_NAME: todosTable.tableName,
      },
      initialPolicy: [
        new iam.PolicyStatement({
          actions: [
            'dynamodb:PutItem',
          ],
          resources: [
            '*'
          ]
        })
      ]
    });

    const listTodoLambda = new lambda.Function(this, 'listTodoLambda', {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset('lambda/todos'),
      handler: 'list-todo.main',
      environment: {
        TODO_TABLE_NAME: todosTable.tableName,
      },
      initialPolicy: [
        new iam.PolicyStatement({
          actions: [
            'dynamodb:Query',
          ],
          resources: [
            '*'
          ]
        })
      ]
    });

    const getTodoLambda = new lambda.Function(this, 'getTodoLambda', {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset('lambda/todos'),
      handler: 'get-todo.main',
      environment: {
        TODO_TABLE_NAME: todosTable.tableName,
      },
      initialPolicy: [
        new iam.PolicyStatement({
          actions: [
            'dynamodb:GetItem',
          ],
          resources: [
            '*'
          ]
        })
      ]
    });

    const updateTodoLambda = new lambda.Function(this, 'updateTodoLambda', {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset('lambda/todos'),
      handler: 'update-todo.main',
      environment: {
        TODO_TABLE_NAME: todosTable.tableName,
      },
      initialPolicy: [
        new iam.PolicyStatement({
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

    const deleteTodoLambda = new lambda.Function(this, 'deleteTodoLambda', {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset('lambda/todos'),
      handler: 'delete-todo.main',
      environment: {
        TODO_TABLE_NAME: todosTable.tableName,
      },
      initialPolicy: [
        new iam.PolicyStatement({
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

    const authApi = new apigateway.RestApi(this, 'AuthApi', {
      restApiName: `${process.env.APP_STACK_NAME}-AuthService`,
    });
    const authResource = authApi.root.addResource('auth');
    authResource.addResource('register').addMethod(
      'POST',
      new apigateway.LambdaIntegration(registerLambda)
    );
    authResource.addResource('login').addMethod(
      'POST',
      new apigateway.LambdaIntegration(loginLambda)
    );

    const todoApi = new apigateway.RestApi(this, 'TodoApi', {
      restApiName: `${process.env.APP_STACK_NAME}-TodoService`,
    });
    const todoResource = todoApi.root.addResource('todos');
    const todoUserResource = todoResource.addResource('{todoId}').addResource('user').addResource('{userId}');
    todoResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(createTodoLambda),
    );
    todoResource.addResource('user').addResource('{userId}').addMethod(
      'GET',
      new apigateway.LambdaIntegration(listTodoLambda),
    );
    todoUserResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(getTodoLambda),
    );
    todoUserResource.addMethod(
      'PUT',
      new apigateway.LambdaIntegration(updateTodoLambda),
    );
    todoUserResource.addMethod(
      'DELETE',
      new apigateway.LambdaIntegration(deleteTodoLambda),
    );

    new cdk.CfnOutput(this, 'UsersTableArn', {
      value: usersTable.tableArn,
    });

    new cdk.CfnOutput(this, 'UsersTableName', {
      value: usersTable.tableName,
    });

    new cdk.CfnOutput(this, 'TodosTableArn', {
      value: todosTable.tableArn,
    });

    new cdk.CfnOutput(this, 'TodosTableName', {
      value: todosTable.tableName,
    });

    new cdk.CfnOutput(this, 'CommentsTableArn', {
      value: commentsTable.tableArn,
    });

    new cdk.CfnOutput(this, 'CommentsTableName', {
      value: commentsTable.tableName,
    });

    new cdk.CfnOutput(this, 'UserPoolId', {
      value: userPool.userPoolId
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: userPoolClient.userPoolClientId
    });

    new cdk.CfnOutput(this, 'AuthApiUrl', {
      value: authApi.url
    });

    new cdk.CfnOutput(this, 'TodoApiUrl', {
      value: todoApi.url
    });

    // The code that defines your stack goes here

    // example resource
    // const queue = new sqs.Queue(this, 'TodoAwsDemoQueue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });
  }
}
