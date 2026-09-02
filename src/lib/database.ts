import { Pool } from "@neondatabase/serverless";
import { getDatabaseEnv } from "@/lib/env";

export interface DatabaseQuery {
  query<T extends Record<string, unknown>>(text: string, params?: readonly unknown[]): Promise<T[]>;
}

export interface Database extends DatabaseQuery {
  transaction<T>(callback: (transaction: DatabaseQuery) => Promise<T>): Promise<T>;
}

let pool: Pool | undefined;

function getPool(): Pool {
  if (pool) return pool;
  const env = getDatabaseEnv();
  if (!env.success) throw new Error("DATABASE_URL is not configured.");
  pool = new Pool({ connectionString: env.data.DATABASE_URL });
  return pool;
}

export const neonDatabase: Database = {
  async query<T extends Record<string, unknown>>(text: string, params: readonly unknown[] = []) {
    const result = await getPool().query(text, [...params]);
    return result.rows as T[];
  },
  async transaction<T>(callback: (transaction: DatabaseQuery) => Promise<T>) {
    const client = await getPool().connect();
    try {
      await client.query("begin");
      const transaction: DatabaseQuery = {
        async query<Row extends Record<string, unknown>>(text: string, params: readonly unknown[] = []) {
          const result = await client.query(text, [...params]);
          return result.rows as Row[];
        },
      };
      const result = await callback(transaction);
      await client.query("commit");
      return result;
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  },
};
