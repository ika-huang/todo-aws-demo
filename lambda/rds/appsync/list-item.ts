import { executeQuery } from '../../utils/sql';

export async function listItem() {
  try {
    const result = await executeQuery(`SELECT * FROM items`);
    return result;
  } catch (err) {
    if (err instanceof Error) {
      throw new Error(err.message);
    } else {
      throw new Error('some error happened');
    };
  }
}
