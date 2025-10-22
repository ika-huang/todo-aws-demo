import { SqlParameter } from '@aws-sdk/client-rds-data';
import { executeQuery } from '../../utils/sql';

export async function deleteItem(id: string) {
  try {
    if (!id) {
      throw new Error('ID is required for deleteItem mutation.');
    }
    const sql = `DELETE FROM items WHERE id = :id RETURNING *;`;
    const parameters: SqlParameter[] = [
      { name: 'id', value: { longValue: parseInt(id) } },
    ];
    const result = await executeQuery(sql, parameters);
    if (result.length === 0) {
      throw new Error(`Item with ID ${id} not found for deletion.`)
    }
    return result[0];
  } catch (err) {
    if (err instanceof Error) {
      throw new Error(err.message);
    } else {
      throw new Error('some error happened');
    };
  }
}
