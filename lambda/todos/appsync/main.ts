import { randomUUID } from 'crypto';
import { AppSyncResolverEvent } from 'aws-lambda';
import { createTodo } from './create-todo';
import { deleteTodo } from './delete-todo';
import { getTodo } from './get-todo';
import { listTodo } from './list-todo';
import { updateTodo } from './update-todo';

interface MyGraphQLArguments {
  id?: string;
  createTodoInput?: { title: string; description?: string };
  updateTodoInput?: { id: string, title?: string; description?: string };
}

export const handler = async (event: AppSyncResolverEvent<MyGraphQLArguments>) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  const userId = event.identity ? ('sub' in event.identity ? event.identity.sub : randomUUID()) : randomUUID(); // 使用者Id

  switch (event.info.fieldName) {
    case 'getTodo':
      return getTodo(event.arguments.id!);
    case 'listTodos':
      return listTodo();
    case 'createTodo':
      return createTodo(event.arguments.createTodoInput!, userId);
    case 'updateTodo':
      return updateTodo(event.arguments.updateTodoInput!);
    case 'deleteTodo':
      return deleteTodo(event.arguments.id!);
    default:
      throw new Error(`Unknown field: ${event.info.fieldName}`);
  }
};
