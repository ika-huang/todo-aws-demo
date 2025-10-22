import {
  Field,
  ColumnMetadata,
  SqlParameter,
  ExecuteStatementCommand,
  RDSDataClient,
} from '@aws-sdk/client-rds-data';

const rdsDataClient = new RDSDataClient({});

export async function executeQuery(sql: string, parameters: SqlParameter[] = []): Promise<any[]> {
  const command = new ExecuteStatementCommand({
    resourceArn: process.env.DB_CLUSTER_ARN,
    secretArn: process.env.DB_SECRET_ARN,
    database: process.env.DB_NAME,
    sql: sql,
    parameters: parameters,
    includeResultMetadata: true,
  });
  const result = await rdsDataClient.send(command);
  console.log(JSON.stringify(result));
  return result.records ? convertRecords(result.records, result.columnMetadata!) : [];
}

export async function convertRecords(records: Field[][], columnMetadata: ColumnMetadata[]): any[] {
  return records.map(row => {
    const obj: any = {};
    row.forEach((field, index) => {
      const keys = Object.keys(field);
      if (keys.length > 0) {
        // 取出第一個有效的欄位值
        const valueKey = keys.find(key => key !== '__type' && field[key as keyof Field] !== undefined);
        if (valueKey) {
          const columnName = columnMetadata[index].name!;
          const value = field[valueKey as keyof Field];
          if (field.isNull) {
            obj[columnName] = null;
          } else {
            obj[columnName] = value;
          }
        }
      }
    });
    return obj;
  });
}
