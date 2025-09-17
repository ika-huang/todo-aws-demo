import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
} from '@aws-sdk/lib-dynamodb';
import { APIGatewayEvent } from 'aws-lambda';
import { randomUUID } from 'crypto';
import {
  createCommentInput,
  createCommentSchema,
} from '../schemas/comments';
import { lambdaResponse } from '../utils/response';

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);
const {
  response,
  errorResponse,
} = new lambdaResponse();

export async function main(event: APIGatewayEvent) {
  try {
    // const body = JSON.parse(event.body || '{}');
    // const { userId, todoId } = event.pathParameters || {};
    const claims = event.requestContext?.authorizer?.claims;
    if (!claims) {
      return errorResponse('Unauthorized', 401);
    };
    const { sub: userId } = claims;
    const { todoId, content }: createCommentInput = createCommentSchema.parse({
      ...(event.pathParameters || {}),
      ...(JSON.parse(event.body || '{}')),
    });
    const commentId = randomUUID();
    const { Item: todo } = await ddbDocClient.send(new GetCommand({
      TableName: process.env.TODO_TABLE_NAME,
      Key: {
        todoId,
        userId,
      },
    }));
    if (!todo) {
      return errorResponse('Todo not found!', 404);
    };
    const putItem = {
      commentId,
      todoId,
      userId,
      content,
      createdAt: new Date().getTime(),
    };
    await ddbDocClient.send(
      new PutCommand({
        TableName: process.env.COMMENT_TABLE_NAME,
        Item: putItem,
      })
    );
    return response(putItem);
  } catch (err: unknown) {
    return errorResponse(err);
  }
}
