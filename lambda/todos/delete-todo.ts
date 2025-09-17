import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  DeleteCommand,
} from '@aws-sdk/lib-dynamodb';
import { APIGatewayEvent } from 'aws-lambda';
import {
  deleteTodoInput,
  deleteTodoSchema,
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
    const claims = event.requestContext?.authorizer?.claims;
    if (!claims) {
      return errorResponse('Unauthorized', 401);
    };
    const { sub: userId } = claims;
    const { todoId }: deleteTodoInput = deleteTodoSchema.parse(event.pathParameters || {});
    const { Item: todo } = await ddbDocClient.send(
      new GetCommand({
        TableName: process.env.TODO_TABLE_NAME,
        Key: {
          todoId,
          userId,
        },
      })
    );
    if (!todo) {
      return errorResponse('Todo not found!', 404);
    };
    await ddbDocClient.send(new DeleteCommand({
      TableName: process.env.TODO_TABLE_NAME,
      Key: {
        todoId,
        userId,
      },
    }));
    return response('delete todo success!');
  } catch (err: unknown) {
    return errorResponse(err);
  };
}
