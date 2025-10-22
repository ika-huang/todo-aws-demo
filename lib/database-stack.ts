import * as cdk from 'aws-cdk-lib';
import {
  Table,
  AttributeType,
  BillingMode,
  ProjectionType,
} from 'aws-cdk-lib/aws-dynamodb';
import {
  DatabaseCluster,
  DatabaseClusterEngine,
  AuroraPostgresEngineVersion,
  ClusterInstance,
  Credentials,
} from 'aws-cdk-lib/aws-rds';
import { NodejsFunction} from 'aws-cdk-lib/aws-lambda-nodejs';
import {
  AwsCustomResource,
  PhysicalResourceId,
  AwsCustomResourcePolicy,
} from 'aws-cdk-lib/custom-resources';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import {
  PolicyStatement,
  Effect,
} from 'aws-cdk-lib/aws-iam';
import {
  Vpc,
  SubnetType,
} from 'aws-cdk-lib/aws-ec2';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

export class DatabaseStack extends cdk.Stack {
  public readonly todoTable: Table;
  public readonly userTable: Table;
  public readonly commentTable: Table;
  public readonly vpc: Vpc;
  public readonly dbCluster: DatabaseCluster;
  public readonly databaseSecret: Secret;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // dynamodb table
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
    });

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
    });

    // ec2 vpc
    this.vpc = new Vpc(this, 'AppSyncRdsVpc', {
      maxAzs: 2, // 使用兩個可用區
      natGateways: 1, // 為了讓 Lambda 能夠存取外部資源 (如 AWS 服務)
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'public',
          subnetType: SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'private',
          subnetType: SubnetType.PRIVATE_WITH_EGRESS, // 私有子網用於 RDS 和 Lambda
        },
      ],
    });

    // secret credential
    this.databaseSecret = new Secret(this, 'AuroraSecret', {
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'dbadmin' }),
        excludeCharacters: '"@/\\',
        generateStringKey: 'password',
      },
    });

    // rds
    this.dbCluster = new DatabaseCluster(this, 'AppSyncAuroraCluster', {
      engine: DatabaseClusterEngine.auroraPostgres({
        version: AuroraPostgresEngineVersion.VER_17_5,
      }),
      // writer: ClusterInstance.provisioned('writer'),
      writer: ClusterInstance.serverlessV2('writer'),
      credentials: Credentials.fromSecret(this.databaseSecret),
      clusterIdentifier: 'appsync-rds-cluster',
      vpc: this.vpc,
      vpcSubnets: {
        subnetType: SubnetType.PRIVATE_WITH_EGRESS,
      },
      serverlessV2MinCapacity: 0.5, // Serverless V2 最小容量
      serverlessV2MaxCapacity: 2,   // Serverless V2 最大容量
      // 啟用 Data API (AppSync 存取 RDS 的無伺服器方式)
      defaultDatabaseName: 'appdb',
    });

    // Custom Resource create items table
    const dataInitFunction = new NodejsFunction(this, 'DataInitFunction', {
      runtime: Runtime.NODEJS_18_X,
      // 假設您的初始化程式碼在 lambda/db-init.ts
      entry: 'lambda/sql/db-init.ts',
      // lambda/rds/appsync/main.ts
      handler: 'handler',
      memorySize: 256,
      timeout: cdk.Duration.seconds(60), // 給予足夠的時間執行 DDL
      
      // 連接到 VPC，以便存取 RDS
      vpc: this.vpc, 
      vpcSubnets: { 
        subnetType: SubnetType.PRIVATE_WITH_EGRESS 
      },
      environment: {
        DB_CLUSTER_ARN: this.dbCluster.clusterArn,
        DB_SECRET_ARN: this.databaseSecret.secretArn,
        DB_NAME: 'appdb',
      },
      initialPolicy: [
        new PolicyStatement({
          actions: [
            'lambda:InvokeFunction',
          ],
          resources: [
            '*'
          ],
        }),
      ],
    });
    this.dbCluster.grantDataApiAccess(dataInitFunction);
    this.databaseSecret.grantRead(dataInitFunction);
    new AwsCustomResource(this, 'DatabaseSchemaInit', {
      onUpdate: {
        service: 'Lambda',
        action: 'invoke',
        parameters: {
          FunctionName: dataInitFunction.functionName,
          // 這裡傳遞一個隨機的或靜態的參數，以確保每次堆疊更新時都執行 Lambda
          Payload: JSON.stringify({ action: 'createTable' }), 
        },
        // 這是 Custom Resource 的實體 ID，確保是獨一無二的
        physicalResourceId: PhysicalResourceId.of('itemsTableInit'),
      },
      onCreate: {
        service: 'Lambda',
        action: 'invoke',
        parameters: {
          FunctionName: dataInitFunction.functionName,
          // 這裡傳遞一個隨機的或靜態的參數，以確保每次堆疊更新時都執行 Lambda
          Payload: JSON.stringify({ action: 'createTable' }), 
        },
        // 這是 Custom Resource 的實體 ID，確保是獨一無二的
        physicalResourceId: PhysicalResourceId.of('itemsTableInit'),
      },
      // 確保在 Data Init Lambda 成功執行後，Custom Resource 才完成
      // policy: AwsCustomResourcePolicy.fromSdkCalls({
      //   resources: AwsCustomResourcePolicy.ANY_RESOURCE,
      // }),
      policy: AwsCustomResourcePolicy.fromStatements([
        new PolicyStatement({
          actions: ['lambda:InvokeFunction'],
          effect: Effect.ALLOW,
          // 資源必須指向您的 Data Init Lambda 函數的 ARN
          resources: ['*'],
        }),
      ]),
    });

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
