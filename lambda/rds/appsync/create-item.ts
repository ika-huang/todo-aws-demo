import { executeQuery } from '../../utils/sql';

export async function createItem(input: { name: string; description?: string, value: number }) {
  try {
    const { name = '', description = '', value = 0 } = input!;
    const sql = `INSERT INTO items (name, description, value, "createdAt")
    VALUES (:name, :description, :value, :createdAt)
    RETURNING *`;
    const now = new Date().getTime();
    const parameters = [
      { name: 'name', value: { stringValue: name } },
      { name: 'description', value: { stringValue: description } },
      { name: 'value', value: { longValue: value } },
      { name: 'createdAt', value: { longValue: now } },
      { name: 'updatedAt', value: { longValue: now } },
    ];
    const result = await executeQuery(sql, parameters);
    return result[0]; // 假設只回傳第一筆新增的資料
  } catch (err) {
    if (err instanceof Error) {
      throw new Error(err.message);
    } else {
      throw new Error('some error happened');
    };
  }
}
