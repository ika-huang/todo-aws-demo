import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
} from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

export async function getTodo(id: string) {
  try {
    const { Item: todo } = await ddbDocClient.send(new GetCommand({
      TableName: process.env.TABLE_NAME,
      Key: {
        id,
      },
    }));
    if (!todo) {
      throw new Error('todo not found!');
    };
    return {
      id: todo.id,
      userId: todo.userId,
      title: todo.title,
      description: todo.description || '',
      createdAt: todo.createdAt,
      updatedAt: todo.updatedAt,
    }
  } catch (err) {
    if (err instanceof Error) {
      throw new Error(err.message);
    } else {
      throw new Error('some error happened');
    };
  }
}