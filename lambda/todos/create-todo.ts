import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { APIGatewayEvent } from 'aws-lambda';
import { randomUUID } from 'crypto';

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

export async function main(event: APIGatewayEvent) {
  try {
    const body = JSON.parse(event.body || '{}');
    const todoId = randomUUID();
    const now = new Date().getTime();
    const putItem = {
      userId: body.userId,
      todoId,
      title: body.title,
      description: body.description || '',
      status: 'pending',
      createdAt: now,
      updatedAt: now,
      completedAt: null,
    };
    await ddbDocClient.send(
      new PutCommand({
        TableName: process.env.TODO_TABLE_NAME,
        Item: putItem,
      })
    );
    return {
      statusCode: 200,
      body: JSON.stringify(putItem),
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
