import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { APIGatewayEvent } from 'aws-lambda';
import { lambdaResponse } from '../utils/response';

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);
const {
  response,
  errorResponse,
} = new lambdaResponse();

export async function main(event: APIGatewayEvent) {
  try {
    // const userId = event.pathParameters?.userId;
    const claims = event.requestContext?.authorizer?.claims;
    if (!claims) {
      return errorResponse('Unauthorized', 401);
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
    return response(todos)
  } catch (err: unknown) {
    return errorResponse(err);
  }
}
