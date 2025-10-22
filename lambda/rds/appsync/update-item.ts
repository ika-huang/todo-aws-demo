import {
  SqlParameter,
  Field,
} from '@aws-sdk/client-rds-data';
import { executeQuery } from '../../utils/sql';

type InputType = {
  id: string;
  name?: string;
  description?: string;
  value?: number;
};
type InputKey = keyof InputType;

export async function updateItem(input: InputType) {
  try {
    const fieldsToUpdate: string[] = [];
    const parameters: SqlParameter[] = [];
    const { id } = input!;
    if (!id) {
      throw new Error("ID is required for updateItem mutation.");
    }
    const existingItem = await executeQuery('SELECT * FROM items WHERE id = :id',
      [
        { name: 'id', value: { longValue: parseInt(id) }},
      ]
    );
    if (existingItem.length === 0) {
      throw new Error('Item not found.'); // 拋出明確錯誤
    }
    const fieldMap: { [key: string]: { sqlName: string; type: 'stringValue' | 'longValue' } } = {
      name: { sqlName: 'name', type: 'stringValue' },
      description: { sqlName: 'description', type: 'stringValue' },
      value: { sqlName: 'value', type: 'longValue' }, // 假設 value 是 Int/BigInt
    };
    for (const key of Object.keys(input)) {
      if (key !== 'id' && input[key as InputKey] !== undefined && input[key as InputKey] !== null) {
        const map = fieldMap[key];
        console.log('map', map);
        if (map) {
          // 將欄位添加到 SET 子句中： "欄位名" = :參數名
          fieldsToUpdate.push(`"${map.sqlName}" = :${key}`);
          // 根據類型構建參數物件
          let paramValue: Field;
          switch(map.type) {
            case 'longValue':
              paramValue = {
                longValue: Number(input[key as InputKey]!),
              };
              break;
            case 'stringValue':
              paramValue = {
                stringValue: input[key as InputKey]!.toString(),
              };
              break;
          }
          parameters.push({ 
            name: key, 
            value: paramValue 
          });
        }
      }
    }
    if (fieldsToUpdate.length === 0) {
      // 如果沒有要更新的欄位，直接拋出錯誤或返回現有資料
      throw new Error('No fields provided for update.');
    }
    // 添加更新時間參數
    fieldsToUpdate.push(`"updatedAt" = :updatedAt`)
    parameters.push({ name: 'updatedAt', value: { longValue: new Date().getTime() } });
    // 構建完整的 SQL 語句
    const setClause = fieldsToUpdate.join(', ');
    const sql = `UPDATE items SET ${setClause} WHERE id = :id RETURNING *`;
    console.log('sql', sql);
    console.log(JSON.stringify(parameters));
    // 添加 ID 參數
    parameters.push({ name: 'id', value: { longValue: parseInt(id) } });
    const result = await executeQuery(sql, parameters);
    return result[0];
  } catch (err) {
    if (err instanceof Error) {
      throw new Error(err.message);
    } else {
      throw new Error('some error happened');
    };
  }
}
