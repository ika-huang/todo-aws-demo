import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { APIGatewayEvent } from 'aws-lambda';

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

export async function main(event: APIGatewayEvent) {
  try {
    // const userId = event.pathParameters?.userId;
    const claims = event.requestContext?.authorizer?.claims;
    if (!claims) {
      return {
        statusCode: 401,
        body: JSON.stringify({
          message: 'Unauthorized'
        }),
      }; 
    };
    const { sub: userId } = claims;
    const { Items: todos } = await ddbDocClient.send(
      new QueryCommand({
        TableName: process.env.TODO_TABLE_NAME,
        KeyConditionExpression: '#userId = :userId',
        IndexName: 'query-by-user-id',
        ExpressionAttributeNames: {
          '#userId': 'userId',
        },
        ExpressionAttributeValues: {
          ':userId': userId
        },
      })
    );
    return {
      statusCode: 200,
      body: JSON.stringify(todos),
    };
  } catch (err: unknown) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: err instanceof Error ? err.message : 'some error happened',
      }),
    };
  }
}
