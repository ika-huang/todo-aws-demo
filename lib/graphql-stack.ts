import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as appsync from 'aws-cdk-lib/aws-appsync';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import {
  Vpc,
  SubnetType,
} from 'aws-cdk-lib/aws-ec2';
import { DatabaseCluster } from 'aws-cdk-lib/aws-rds';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { UserPool } from 'aws-cdk-lib/aws-cognito';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import * as path from 'path';

interface GraphqlStackProps extends cdk.StackProps {
  userPool: UserPool;
  vpc: Vpc;
  dbCluster: DatabaseCluster;
  databaseSecret: Secret;
}

export class GraphqlStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: GraphqlStackProps) {
    super(scope, id, props);

    const { userPool, vpc, dbCluster, databaseSecret } = props;

    // 建立 AppSync API
    const api = new appsync.GraphqlApi(this, 'TodoApi', {
      name: 'todo-appsync-api',
      schema: appsync.SchemaFile.fromAsset(path.resolve(__dirname, '../graphql/schemas/schema.graphql')),
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: appsync.AuthorizationType.USER_POOL,
          userPoolConfig: {
            userPool: userPool,
          },
        },
        additionalAuthorizationModes: [
          {
            authorizationType: appsync.AuthorizationType.API_KEY, // 先用 API_KEY 測試
          },
        ]
      },
      xrayEnabled: true,
    });

    // 建立 DynamoDB Table
    const todoTable = new dynamodb.Table(this, 'NewTodoTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const todoLambda = new NodejsFunction(this, 'NewTodoLambda', {
      runtime: Runtime.NODEJS_20_X,
      entry: 'lambda/todos/appsync/main.ts',
      handler: 'handler',
      environment: {
        TABLE_NAME: todoTable.tableName,
      },
    });

    const appSyncRdsResolver = new NodejsFunction(this, 'AppSyncRdsResolver', {
      runtime: Runtime.NODEJS_18_X,
      // entry: 'lambda/handler.ts',
      entry: 'lambda/rds/appsync/main.ts',
      handler: 'handler',
      timeout: cdk.Duration.seconds(10),
      vpc: vpc, 
      vpcSubnets: { 
        subnetType: SubnetType.PRIVATE_WITH_EGRESS 
      },
      environment: {
        DB_CLUSTER_ARN: dbCluster.clusterArn,
        DB_SECRET_ARN: databaseSecret.secretArn,
        DB_NAME: 'appdb',
      },
      initialPolicy: [
        new PolicyStatement({
          actions: [
            'ec2:CreateNetworkInterface',
            'ec2:DeleteNetworkInterface',
            'ec2:DescribeNetworkInterfaces',
          ],
          resources: [
            '*'
          ],
        }),
      ],
    });

    // 建立 Lambda
    // const todoLambda = new lambda.Function(this, 'TodoLambda', {
    //   runtime: lambda.Runtime.NODEJS_18_X,
    //   handler: 'main.handler',
    //   code: lambda.Code.fromAsset(path.resolve(__dirname, '../graphql/src/todos')),
    //   environment: {
    //     TABLE_NAME: todoTable.tableName,
    //   },
    // });

    // permission
    todoTable.grantReadWriteData(todoLambda);
    dbCluster.grantDataApiAccess(appSyncRdsResolver);
    databaseSecret.grantRead(appSyncRdsResolver);

    // todo
    const lambdaDs = api.addLambdaDataSource('LambdaDatasource', todoLambda);

    lambdaDs.createResolver('QueryLambdaGetTodoResolver', {
      typeName: 'Query',
      fieldName: 'getTodo',
    });
    lambdaDs.createResolver('QueryLambdaListTodosResolver', {
      typeName: 'Query',
      fieldName: 'listTodos',
    });
    lambdaDs.createResolver('MutationLambdaCreateTodoResolver', {
      typeName: 'Mutation',
      fieldName: 'createTodo',
    });
    lambdaDs.createResolver('MutationLambdaUpdateTodoResolver', {
      typeName: 'Mutation',
      fieldName: 'updateTodo',
    });
    lambdaDs.createResolver('MutationLambdaDeleteTodoResolver', {
      typeName: 'Mutation',
      fieldName: 'deleteTodo',
    });

    // rds
    const rdsLambdaDataSource = api.addLambdaDataSource('LambdaDataSource', appSyncRdsResolver);

    rdsLambdaDataSource.createResolver('QueryLambdaListItemsResolver',{
      typeName: 'Query',
      fieldName: 'listItems',
    });
    rdsLambdaDataSource.createResolver('MutationLambdaCreateItemResolver',{
      typeName: 'Mutation',
      fieldName: 'createItem',
    });
    rdsLambdaDataSource.createResolver('MutationLambdaUpdateItemResolver',{
      typeName: 'Mutation',
      fieldName: 'updateItem',
    });
    rdsLambdaDataSource.createResolver('MutationLambdaDeleteItemResolver', { 
      typeName: 'Mutation', 
      fieldName: 'deleteItem',
    });

    // 加入 DataSource
    // const todoDS = api.addDynamoDbDataSource('TodoDataSource', todoTable);

    // // Resolver (直接用 VTL)
    // todoDS.createResolver('QueryListTodosResolver', {
    //   typeName: 'Query',
    //   fieldName: 'listTodos',
    //   requestMappingTemplate: appsync.MappingTemplate.dynamoDbScanTable(),
    //   responseMappingTemplate: appsync.MappingTemplate.dynamoDbResultList(),
    // });

    // todoDS.createResolver('QueryGetTodoResolver', {
    //   typeName: 'Query',
    //   fieldName: 'getTodo',
    //   requestMappingTemplate: appsync.MappingTemplate.dynamoDbGetItem('id', 'id'),
    //   responseMappingTemplate: appsync.MappingTemplate.dynamoDbResultItem(),
    // });

    // todoDS.createResolver('MutationAddTodoResolver', {
    //   typeName: 'Mutation',
    //   fieldName: 'createTodo',
    //   requestMappingTemplate: appsync.MappingTemplate.dynamoDbPutItem(
    //     appsync.PrimaryKey.partition('id').auto(),
    //     appsync.Values.projecting()
    //   ),
    //   responseMappingTemplate: appsync.MappingTemplate.dynamoDbResultItem(),
    // });

    // todoDS.createResolver('MutationDeleteTodoResolver', {
    //   typeName: 'Mutation',
    //   fieldName: 'deleteTodo',
    //   requestMappingTemplate: appsync.MappingTemplate.dynamoDbDeleteItem('id', 'id'),
    //   responseMappingTemplate: appsync.MappingTemplate.dynamoDbResultItem(),
    // });

    new cdk.CfnOutput(this, 'GraphQLAPIURL', { value: api.graphqlUrl });
    new cdk.CfnOutput(this, 'GraphQLAPIKey', { value: api.apiKey || '' });
  }
}
