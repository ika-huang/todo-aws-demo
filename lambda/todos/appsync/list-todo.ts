import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

export async function listTodo() {
  try {
    const { Items: todos } = await ddbDocClient.send(new ScanCommand({
      TableName: process.env.TABLE_NAME,
    }));
    return (
      todos?.map((todo) => ({
        id: todo.id,
        userId: todo.userId,
        title: todo.title,
        description: todo.description || '',
        createdAt: todo.createdAt,
        updatedAt: todo.updatedAt,
      })) || []
    );
  } catch (err) {
    if (err instanceof Error) {
      throw new Error(err.message);
    } else {
      throw new Error('some error happened');
    };
  }
}