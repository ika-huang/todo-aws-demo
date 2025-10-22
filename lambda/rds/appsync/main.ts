import { AppSyncResolverEvent } from 'aws-lambda';
import { createItem } from './create-item';
import { listItem } from './list-item';
import { updateItem } from './update-item';
import { deleteItem } from './delete-item';

interface MyGraphQLArguments {
  id: string;
  createItemInput?: { name: string; description: string, value: number };
  updateItemInput?: { id: string, name?: string; description?: string, value?: number }
}

export const handler = async (event: AppSyncResolverEvent<MyGraphQLArguments>) => {
  // event 結構來自 AppSync
  const { info, arguments: args } = event;
  switch (info.fieldName) {
    case 'listItems':
      return await listItem();
    case 'createItem':
      return await createItem(args.createItemInput!);
    case 'updateItem':
      return await updateItem(args.updateItemInput!);
    case 'deleteItem':
      return await deleteItem(args.id!);
    default:
      throw new Error(`Unknown field: ${info.fieldName}`);
  }
};
