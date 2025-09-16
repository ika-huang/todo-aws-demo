import * as cdk from 'aws-cdk-lib';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import {
  RestApi,
  LambdaIntegration,
} from 'aws-cdk-lib/aws-apigateway';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import {
  UserPool,
  UserPoolClient,
} from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';

interface AuthStackProps extends cdk.StackProps {
  userTable: Table;
}

export class AuthStack extends cdk.Stack {
  public readonly userPool: UserPool;
  public readonly userPoolClient: UserPoolClient;
  public readonly authApi: RestApi;

  constructor(scope: Construct, id: string, props: AuthStackProps) {
    
    super(scope, id, props);

    // cognito
    this.userPool = new UserPool(this, 'TodosUserPool', {
      userPoolName: `${process.env.APP_STACK_NAME}-TodosUserPool`,
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
      },
      autoVerify: {
        email: true,
      },
    });
    this.userPoolClient = new UserPoolClient(this, 'TodosUserPoolClient', {
      userPool: this.userPool,
      authFlows: {
        userPassword: true,
      },
    });

    // lambda
    const registerLambda = new NodejsFunction(this, 'RegisterLambda', {
      runtime: Runtime.NODEJS_20_X,
      entry: 'lambda/auth/register.ts',
      handler: 'main',
      environment: {
        USER_POOL_ID: this.userPool.userPoolId,
        CLIENT_ID: this.userPoolClient.userPoolClientId,
      },
      initialPolicy: [
        new PolicyStatement({
          actions: [
            'cognito-idp:SignUp',
            'cognito-idp:AdminConfirmSignUp'
          ],
          resources: [
            this.userPool.userPoolArn,
          ]
        }),
      ],
    });

    const loginLambda = new NodejsFunction(this, 'LoginLambda', {
      runtime: Runtime.NODEJS_20_X,
      entry: 'lambda/auth/login.ts',
      handler: 'main',
      environment: {
        USER_POOL_ID: this.userPool.userPoolId,
        CLIENT_ID: this.userPoolClient.userPoolClientId,
      },
      initialPolicy: [
        new PolicyStatement({
          actions: [
            'cognito-idp:InitiateAuth',
          ],
          resources: [
            '*'
          ]
        })
      ]
    });

    // apigateway
    this.authApi = new RestApi(this, 'AuthApi', {
      restApiName: `${process.env.APP_STACK_NAME}-AuthService`,
    });
    const authResource = this.authApi.root.addResource('auth');
    authResource.addResource('register').addMethod(
      'POST',
      new LambdaIntegration(registerLambda)
    );
    authResource.addResource('login').addMethod(
      'POST',
      new LambdaIntegration(loginLambda)
    );

    new cdk.CfnOutput(this, 'AuthApiUrl', {
      value: this.authApi.url,
    });
  }
}
