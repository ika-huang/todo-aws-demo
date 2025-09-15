import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';
import { APIGatewayEvent } from 'aws-lambda';
import { 
  getTodoInput,
  getTodoSchema,
  validateErrorMessage,
 } from '../schemas/todo';
 import { z } from 'zod';

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

export async function main(event: APIGatewayEvent) {
  try {
    const { userId, todoId }: getTodoInput = getTodoSchema.parse(event.pathParameters || {});
    const { Item: todo } = await ddbDocClient.send(
      new GetCommand({
        TableName: process.env.TODO_TABLE_NAME,
        Key: {
          todoId,
          userId,
        },
      })
    );
    if (!todo) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          message: 'Todo not found!',
        }),
      };
    };
    return {
      statusCode: 200,
      body: JSON.stringify(todo),
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
