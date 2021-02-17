import mysql from 'mysql';
import { promisify } from 'util';
import { ResolveAwait } from '@cubejs-backend/shared';

export async function createConnection(config: any) {
  const conn = mysql.createConnection(config);
  const connect = promisify(conn.connect.bind(conn));

  if (conn.on) {
    conn.on('error', () => {
      conn.destroy();
    });
  }

  await connect();

  return {
    ...conn,
    execute: promisify(conn.query.bind(conn))
  };
}

export type AsyncConnection = ResolveAwait<ReturnType<typeof createConnection>>;
