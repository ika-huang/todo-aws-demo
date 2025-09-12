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
import {
  UserPool,
  UserPoolClient,
} from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';

interface AuthStackProps extends cdk.StackProps {
  userTable: Table;
  authApi: RestApi;
}

export class AuthStack extends cdk.Stack {
  public readonly userPool: UserPool;
  public readonly userPoolClient: UserPoolClient;

  constructor(scope: Construct, id: string, props: AuthStackProps) {
    super(scope, id, props);

    const { authApi } = props;

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
    const registerLambda = new Function(this, 'RegisterLambda', {
      runtime: Runtime.NODEJS_20_X,
      code: Code.fromAsset('lambda/auth'),
      handler: 'register.main',
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

    const loginLambda = new Function(this, 'LoginLambda', {
      runtime: Runtime.NODEJS_20_X,
      code: Code.fromAsset('lambda/auth'),
      handler: 'login.main',
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
    const authResource = authApi.root.addResource('auth');
    authResource.addResource('register').addMethod(
      'POST',
      new LambdaIntegration(registerLambda)
    );
    authResource.addResource('login').addMethod(
      'POST',
      new LambdaIntegration(loginLambda)
    );
  }
}
