import oracledb from 'oracledb';

oracledb.initOracleClient({
  libDir: '/Users/kanyapat/Downloads/instantclient_23_26',
});

export async function executeQuery(sql: string) {
  const connection = await oracledb.getConnection({
    user: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!,
    connectString: `${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_SERVICE}`,
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