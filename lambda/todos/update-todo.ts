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
} from '../schemas/todo';
import { lambdaResponse } from '../utils/response';

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);
const {
  response,
  errorResponse,
} = new lambdaResponse();

export async function main(event: APIGatewayEvent) {
  try {
    // const { userId, todoId } = event.pathParameters || {};
    // const pathParameters = event.pathParameters || {};
    // const body: { [key: string]: unknown } = event.body ? JSON.parse(event.body) : {};
    const claims = event.requestContext?.authorizer?.claims;
    if (!claims) {
      return errorResponse('Unauthorized', 401);
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
      return errorResponse('Todo not found!', 404);
    };
    if (!title && !description && !status) {
      return errorResponse('No fields to update!', 400);
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
    return response(result.Attributes);
  } catch (err: unknown) {
    return errorResponse(err);
  }
}
