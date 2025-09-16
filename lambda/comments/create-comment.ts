import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
} from '@aws-sdk/lib-dynamodb';
import { APIGatewayEvent } from 'aws-lambda';
import { randomUUID } from 'crypto';
import {
  createCommentInput,
  createCommentSchema,
  validateErrorMessage,
} from '../schemas/comments';
import { z } from 'zod';

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

export async function main(event: APIGatewayEvent) {
  try {
    // const body = JSON.parse(event.body || '{}');
    // const { userId, todoId } = event.pathParameters || {};
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
    const { todoId, content }: createCommentInput = createCommentSchema.parse({
      ...(event.pathParameters || {}),
      ...(JSON.parse(event.body || '{}')),
    });
    const commentId = randomUUID();
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
    const putItem = {
      commentId,
      todoId,
      userId,
      content,
      createdAt: new Date().getTime(),
    };
    await ddbDocClient.send(
      new PutCommand({
        TableName: process.env.COMMENT_TABLE_NAME,
        Item: putItem,
      })
    );
    return {
      statusCode: 200,
      body: JSON.stringify(putItem),
    };
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return validateErrorMessage(err);
    };
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: err instanceof Error ? err.message : 'some error happened',
      }),
    };
  }
}
