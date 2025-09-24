import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  DeleteCommand,
} from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

export async function deleteTodo(id: string) {
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
    await ddbDocClient.send(new DeleteCommand({
      TableName: process.env.TABLE_NAME,
      Key: {
        id,
      },
    }));
    return true;
  } catch (err) {
    if (err instanceof Error) {
      throw new Error(err.message);
    } else {
      throw new Error('some error happened');
    };
  }
}