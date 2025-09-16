import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  UpdateCommand,
  NativeAttributeValue,
} from '@aws-sdk/lib-dynamodb';
import { APIGatewayEvent } from 'aws-lambda';
import {
  updateTodoInput,
  updateTodoSchema,
  validateErrorMessage,
} from '../schemas/todo';
import { z } from 'zod';

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

export async function main(event: APIGatewayEvent) {
  try {
    // const { userId, todoId } = event.pathParameters || {};
    // const pathParameters = event.pathParameters || {};
    // const body: { [key: string]: unknown } = event.body ? JSON.parse(event.body) : {};
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
    const { todoId, title, description, status }: updateTodoInput = updateTodoSchema.parse({
      ...(event.pathParameters || {}),
      ...(event.body ? JSON.parse(event.body) : {}),
    });
    const now = Date.now();
    // const { title, description, status } = body;
    const expressionAttributeNames : { [key: string]: string } = {
      '#updatedAt': 'updatedAt',
    };
    const expressionAttributeValues: { [key: string]: NativeAttributeValue }= {
      ':updatedAt': now,
    };
    const updateExpression: string[] = ['#updatedAt = :updatedAt'];
    const { Item: todo } = await ddbDocClient.send(
      new GetCommand({
        TableName: process.env.TODO_TABLE_NAME,
        Key: {
          todoId: todoId,
          userId: userId,
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
    if (!title && !description && !status) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: 'No fields to update!',
        }),
      };
    }
    if (title) {
      expressionAttributeNames['#title'] = 'title';
      expressionAttributeValues[':title'] = title;
      updateExpression.push('#title = :title');
    }
    if (description) {
      expressionAttributeNames['#description'] = 'description';
      expressionAttributeValues[':description'] = description;
      updateExpression.push('#description = :description');
    }
    if (status) {
      expressionAttributeNames['#status'] = 'status';
      expressionAttributeValues[':status'] = status;
      updateExpression.push('#status = :status');
    }
    const result = await ddbDocClient.send(new UpdateCommand({
      TableName: process.env.TODO_TABLE_NAME,
      Key: {
        userId: userId,
        todoId: todoId,
      },
      UpdateExpression: `set ${updateExpression.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    }));
    return {
      statusCode: 200,
      body: JSON.stringify(result.Attributes),
    };
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      console.log(err.issues)
      return validateErrorMessage(err);
    }
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: err instanceof Error ? err.message : 'some error happened'
      }),
    };
  }
}
