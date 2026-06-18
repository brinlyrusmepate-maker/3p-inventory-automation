import oracledb from 'oracledb';
import 'dotenv/config';

oracledb.initOracleClient({
  libDir: '/Users/kanyapat/Downloads/instantclient_23_26',
});

export async function execute3PRdsQuery(sql: string) {
  const connection = await oracledb.getConnection({
    user: process.env.RDS_3P_DB_USER!,
    password: process.env.RDS_3P_DB_PASSWORD!,
    connectString: `${process.env.RDS_3P_DB_HOST}:${process.env.RDS_3P_DB_PORT}/${process.env.RDS_3P_DB_SERVICE}`,
  });

  try {
    const result = await connection.execute(sql, [], {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
    });

    return result.rows;
  } finally {
    await connection.close();
  }
}