import * as cdk from 'aws-cdk-lib';
import {
  Table,
  AttributeType,
  BillingMode,
  ProjectionType,
} from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

export class DatabaseStack extends cdk.Stack {
  public readonly todoTable: Table;
  public readonly userTable: Table;
  public readonly commentTable: Table;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.userTable = new Table(this, 'UserTable', {
      partitionKey: {
        name: 'userId',
        type: AttributeType.STRING
      },
      billingMode: BillingMode.PAY_PER_REQUEST,
      tableName: `${process.env.APP_STACK_NAME}-Users`,
    });

    this.todoTable = new Table(this, 'TodoTable', {
      partitionKey: {
        name: 'todoId',
        type: AttributeType.STRING,
      },
      sortKey: {
        name: 'userId',
        type: AttributeType.STRING,
      },
      billingMode: BillingMode.PAY_PER_REQUEST,
      tableName: `${process.env.APP_STACK_NAME}-Todos`,
    });

    this.todoTable.addGlobalSecondaryIndex({
      indexName: 'query-by-user-id',
      partitionKey: {
        name: 'userId',
        type: AttributeType.STRING,
      },
      projectionType: ProjectionType.ALL,
    })

    this.commentTable = new Table(this, 'CommentTable', {
      partitionKey: {
        name: 'commentId',
        type: AttributeType.STRING,
      },
      sortKey: {
        name: 'todoId',
        type: AttributeType.STRING,
      },
      billingMode: BillingMode.PAY_PER_REQUEST,
      tableName: `${process.env.APP_STACK_NAME}-Comments`,
    });

    this.commentTable.addGlobalSecondaryIndex({
      indexName: 'query-by-todo-id',
      partitionKey: {
        name: 'todoId',
        type: AttributeType.STRING,
      },
      projectionType: ProjectionType.ALL,
    })

    new cdk.CfnOutput(this, 'UserTableArn', {
      value: this.userTable.tableArn,
    });

    new cdk.CfnOutput(this, 'UserTableName', {
      value: this.userTable.tableName,
    });
    
    new cdk.CfnOutput(this, 'TodoTableArn', {
      value: this.todoTable.tableArn,
    });

    new cdk.CfnOutput(this, 'TodoTableName', {
      value: this.todoTable.tableName,
    });

    new cdk.CfnOutput(this, 'CommentTableArn', {
      value: this.commentTable.tableArn,
    });

    new cdk.CfnOutput(this, 'CommentTableName', {
      value: this.commentTable.tableName,
    });
  }
}
