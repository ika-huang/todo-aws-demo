import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  UpdateCommand,
  NativeAttributeValue,
} from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

interface UpdateTodoInput {
  id: string;
  title?: string;
  description?: string;
}

export async function updateTodo(input: UpdateTodoInput) {
  try {
    const { id, title, description } = input;
    if (!title && !description) {
      throw new Error('No fields to update!');
    };
    const now = new Date().getTime();
    const expressionAttributeNames : { [key: string]: string } = {
      '#updatedAt': 'updatedAt',
    };
    const expressionAttributeValues: { [key: string]: NativeAttributeValue }= {
      ':updatedAt': now,
    };
    const updateExpression: string[] = ['#updatedAt = :updatedAt'];
    const { Item: todo } = await ddbDocClient.send(new GetCommand({
      TableName: process.env.TABLE_NAME,
      Key: {
        id,
      },
    }));
    if (!todo) {
      throw new Error('todo not found!');
    };
    if (title) {
      expressionAttributeNames['#title'] = 'title';
      expressionAttributeValues[':title'] = title;
      updateExpression.push('#title = :title');
    };
    if (description) {
      expressionAttributeNames['#description'] = 'description';
      expressionAttributeValues[':description'] = description;
      updateExpression.push('#description = :description');
    };
    await ddbDocClient.send(new UpdateCommand({
      TableName: process.env.TABLE_NAME,
      Key: {
        id,
      },
      UpdateExpression: `set ${updateExpression.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW',
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
