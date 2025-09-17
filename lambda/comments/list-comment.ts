import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';
import { APIGatewayEvent } from 'aws-lambda';
import {
  listCommentInput,
  listCommentSchema,
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
    // const { todoId, userId } = event.pathParameters || {};
    const claims = event.requestContext?.authorizer?.claims;
    if (!claims) {
      return errorResponse('Unauthorized', 401);
    };
    const { sub: userId } = claims;
    const { todoId }: listCommentInput = listCommentSchema.parse(event.pathParameters || {});
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
    const { Items: comments } = await ddbDocClient.send(new QueryCommand({
      TableName: process.env.COMMENT_TABLE_NAME,
      IndexName: 'query-by-todo-id',
      KeyConditionExpression: '#todoId = :todoId',
      ExpressionAttributeNames: {
        '#todoId': 'todoId',
      },
      ExpressionAttributeValues: {
        ':todoId': todoId,
      },
    }));
    return response(comments);
  } catch (err: unknown) {
    return errorResponse(err);
  }
}
