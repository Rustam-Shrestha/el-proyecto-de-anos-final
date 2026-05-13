import { Pool as PostgresPool } from "pg";
import { newDb } from "pg-mem";
import { env } from "@config/env";

type QueryablePool = {
  query: (...args: any[]) => Promise<any>;
  end: () => Promise<void>;
};

let activePool: QueryablePool | null = null;
let poolPromise: Promise<QueryablePool> | null = null;

const createMemoryPool = (): QueryablePool => {
  const memoryDb = newDb({ autoCreateForeignKeyIndices: true });
  const { Pool } = memoryDb.adapters.createPg();
  return new Pool() as QueryablePool;
};

const createNativePool = (): QueryablePool => {
  return new PostgresPool({
    connectionString: env.DATABASE_URL
  });
};

const ensurePool = async (): Promise<QueryablePool> => {
  if (activePool) {
    return activePool;
  }

  if (!poolPromise) {
    poolPromise = (async () => {
      const nativePool = createNativePool();

      try {
        await nativePool.query("SELECT 1");
        activePool = nativePool;
        return nativePool;
      } catch (error) {
        await nativePool.end().catch(() => undefined);

        if (env.NODE_ENV === "test") {
          activePool = createMemoryPool();
          return activePool;
        }

        throw error;
      }
    })();
  }

  return poolPromise;
};

export const pool = {
  query: async (...args: any[]) => {
    const poolInstance = await ensurePool();
    return poolInstance.query(...args);
  },
  end: async () => {
    const poolInstance = await ensurePool();
    return poolInstance.end();
  }
};
