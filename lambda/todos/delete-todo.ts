import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  DeleteCommand,
} from '@aws-sdk/lib-dynamodb';
import { APIGatewayEvent } from 'aws-lambda';

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

export async function main(event: APIGatewayEvent) {
  try {
    const { userId, todoId } = event.pathParameters || {};
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
    await ddbDocClient.send(new DeleteCommand({
      TableName: process.env.TODO_TABLE_NAME,
      Key: {
        todoId,
        userId,
      }
    }));
    return {
      statusCode: 200,
      body: 'delete todo success!',
    };
  } catch (err: unknown) {
    return { statusCode: 500, body: JSON.stringify({ message: err instanceof Error ? err.message : 'some error happened' }) };
  }
}
