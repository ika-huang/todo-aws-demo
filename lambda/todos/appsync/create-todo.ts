import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
} from '@aws-sdk/lib-dynamodb';
import { randomUUID } from 'crypto';

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

export async function createTodo(input: { title: string; description?: string }, userId: string) {
  try {
    const now = new Date().getTime();
    const item = {
      id: randomUUID(),
      userId,
      title: input.title,
      description: input.description,
      createdAt: now,
      updatedAt: now,
    };
    await ddbDocClient.send(new PutCommand({
      TableName: process.env.TABLE_NAME,
      Item: item,
    }));
    return {
      id: item.id,
      userId: item.userId,
      title: item.title,
      description: item.description,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };  
  } catch (err) {
    if (err instanceof Error) {
      throw new Error(err.message);
    } else {
      throw new Error('some error happened');
    };
  }
}