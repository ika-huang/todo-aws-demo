import * as cdk from 'aws-cdk-lib';
import {
  RestApi,
} from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';

export class ApiGatewayStack extends cdk.Stack {
  public readonly todoApi: RestApi;
  public readonly authApi: RestApi;
  public readonly commentApi: RestApi;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.todoApi = new RestApi(this, 'TodoApi', {
      restApiName: `${process.env.APP_STACK_NAME}-TodoService`,
    });
    this.authApi = new RestApi(this, 'AuthApi', {
      restApiName: `${process.env.APP_STACK_NAME}-AuthService`,
    });
    this.commentApi = new RestApi(this, 'CommentApi', {
      restApiName: `${process.env.APP_STACK_NAME}-CommentService`,
    });

    new cdk.CfnOutput(this, 'AuthApiUrl', {
      value: this.authApi.url,
    });
    new cdk.CfnOutput(this, 'TodoApiUrl', {
      value: this.todoApi.url,
    });
    new cdk.CfnOutput(this, 'CommentApiUrl', {
      value: this.commentApi.url,
    });
  }
}
