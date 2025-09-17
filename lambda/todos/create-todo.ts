import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { APIGatewayEvent } from 'aws-lambda';
import { randomUUID } from 'crypto';
import {
  createTodoInput,
  createTodoSchema,
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
    const claims = event.requestContext?.authorizer?.claims;
    if (!claims) {
      return errorResponse('Unauthorized', 401);
    };
    const { sub: userId } = claims;
    const body: createTodoInput = createTodoSchema.parse(JSON.parse(event.body || '{}'));
    const todoId = randomUUID();
    const now = new Date().getTime();
    const putItem = {
      userId,
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
    return response(putItem);
  } catch (err: unknown) {
    return errorResponse(err);
  }
}
