import {
  RDSDataClient,
  ExecuteStatementCommand,
} from '@aws-sdk/client-rds-data';

const rdsDataClient = new RDSDataClient({});

const DB_CLUSTER_ARN = process.env.DB_CLUSTER_ARN!;
const DB_SECRET_ARN = process.env.DB_SECRET_ARN!;
const DB_NAME = process.env.DB_NAME!;

// 從檔案系統讀取 SQL 語句
// const sql = fs.readFileSync(path.join(__dirname, '..', INIT_SQL_PATH), 'utf-8');

export const handler = async (event: any) => {
  // 這是 Custom Resource 的標準事件處理，用於處理 CREATE, UPDATE, DELETE 事件
  console.log('event', JSON.stringify(event));
  if (event.RequestType === 'Delete') {
    console.log('Skipping table deletion for Delete event.');
    return; // 通常不刪除資料庫表格
  }
  // console.log(`Executing SQL for schema initialization:\n${sql}`);
  try {
    const command = new ExecuteStatementCommand({
      resourceArn: DB_CLUSTER_ARN,
      secretArn: DB_SECRET_ARN,
      database: DB_NAME,
      sql: `CREATE TABLE IF NOT EXISTS items(
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        value INTEGER,
        "createdAt" FLOAT NOT NULL,
        "updatedAt" FLOAT
      );`,
    });
    const result = await rdsDataClient.send(command);
    console.log('SQL execution successful:', result);
    return { Status: 'SUCCESS' };
  } catch (error) {
    console.error('SQL execution failed:', error);
    // Custom Resource 錯誤必須拋出例外，以便 CloudFormation 知道部署失敗
    throw new Error(`Failed to initialize database schema: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};
