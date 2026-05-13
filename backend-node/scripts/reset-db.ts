import { Pool } from "pg";
import { env } from "../src/config/env";

const getDatabaseName = (databaseUrl: string): string => {
  const url = new URL(databaseUrl);
  const databaseName = url.pathname.replace(/^\//, "");

  if (!databaseName) {
    throw new Error("DATABASE_URL must include a database name");
  }

  return databaseName;
};

const buildAdminDatabaseUrl = (databaseUrl: string): string => {
  const url = new URL(databaseUrl);
  url.pathname = "/postgres";
  return url.toString();
};

const ensureDatabaseExists = async (databaseUrl: string) => {
  const targetDatabase = getDatabaseName(databaseUrl);

  if (!/^[A-Za-z0-9_]+$/.test(targetDatabase)) {
    throw new Error(`Unsupported database name: ${targetDatabase}`);
  }

  const adminPool = new Pool({ connectionString: buildAdminDatabaseUrl(databaseUrl) });

  try {
    const result = await adminPool.query("SELECT 1 FROM pg_database WHERE datname = $1", [targetDatabase]);
    if (result.rowCount === 0) {
      console.log(`🛠️ Creating database '${targetDatabase}'...`);
      await adminPool.query(`CREATE DATABASE "${targetDatabase}"`);
      console.log(`✅ Database '${targetDatabase}' created`);
    }
  } finally {
    await adminPool.end();
  }
};

async function resetDatabase() {
  const databaseUrl = env.DATABASE_URL;
  let pool: Pool | undefined;

  try {
    await ensureDatabaseExists(databaseUrl);
    pool = new Pool({ connectionString: databaseUrl });

    console.log("🔄 Dropping existing tables (if any)...");
    
    // Drop tables in reverse order of dependencies
    await pool.query("DROP TABLE IF EXISTS face_verifications CASCADE");
    await pool.query("DROP TABLE IF EXISTS ocr_results CASCADE");
    await pool.query("DROP TABLE IF EXISTS documents CASCADE");
    await pool.query("DROP TABLE IF EXISTS kyc_applications CASCADE");
    await pool.query("DROP TABLE IF EXISTS audit_logs CASCADE");
    await pool.query("DROP TABLE IF EXISTS sessions CASCADE");
    await pool.query("DROP TABLE IF EXISTS users CASCADE");
    await pool.query("DROP TABLE IF EXISTS roles CASCADE");
    
    console.log("✅ All tables dropped successfully");
    console.log("📝 Run 'npm run dev' to reinitialize the database with correct schema");
    
  } catch (error) {
    console.error("❌ Error resetting database:", error);
    process.exit(1);
  } finally {
    await pool?.end().catch(() => undefined);
  }
}

resetDatabase();
