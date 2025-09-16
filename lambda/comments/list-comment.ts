import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';
import { APIGatewayEvent } from 'aws-lambda';
import {
  listCommentInput,
  listCommentSchema,
  validateErrorMessage,
} from '../schemas/comments';
import { z } from 'zod';

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

export async function main(event: APIGatewayEvent) {
  try {
    // const { todoId, userId } = event.pathParameters || {};
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
    const { todoId }: listCommentInput = listCommentSchema.parse(event.pathParameters || {});
    const { Item: todo } = await ddbDocClient.send(new GetCommand({
      TableName: process.env.TODO_TABLE_NAME,
      Key: {
        todoId,
        userId,
      },
    }));
    if (!todo) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          message: 'Todo not found!',
        }),
      };
    };
    const { Items: comments } = await ddbDocClient.send(new QueryCommand({
      TableName: process.env.COMMENT_TABLE_NAME,
      IndexName: 'query-by-todo-id',
      KeyConditionExpression: '#todoId = :todoId',
      ExpressionAttributeNames: {
        '#todoId': 'todoId',
      },
      ExpressionAttributeValues: {
        ':todoId': todoId,
      },
    }));
    return {
      statusCode: 200,
      body: JSON.stringify(comments),
    };
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return validateErrorMessage(err);
    };
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: err instanceof Error ? err.message : 'some error happened'
      }),
    };
  }
}
