import { TodoStack } from './todo-stack';
import { AuthStack } from './auth-stack';
import { CommentStack } from './comment-stack';
import { DatabaseStack } from './database-stack';
import { ApiGatewayStack } from './api-gateway-stack';

export const libStack = {
  TodoStack,
  AuthStack,
  CommentStack,
  DatabaseStack,
  ApiGatewayStack,
}