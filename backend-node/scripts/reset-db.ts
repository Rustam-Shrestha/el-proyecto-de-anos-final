import { pool } from "../src/db/pool";

async function resetDatabase() {
  try {
    console.log("Dropping all tables in auth schema...");

    await pool.query(`
      DO $$ DECLARE
        r RECORD;
      BEGIN
        FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'auth') LOOP
          EXECUTE 'DROP TABLE IF EXISTS auth.' || quote_ident(r.tablename) || ' CASCADE';
        END LOOP;
      END $$;
    `);

    console.log("Dropping all enums in auth schema...");
    await pool.query(`
      DO $$ DECLARE
        r RECORD;
      BEGIN
        FOR r IN (SELECT t.typname FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE n.nspname = 'auth' AND t.typtype = 'e') LOOP
          EXECUTE 'DROP TYPE IF EXISTS auth.' || quote_ident(r.typname) || ' CASCADE';
        END LOOP;
      END $$;
    `);

    console.log("All tables and enums dropped successfully");
    console.log("Run 'npx prisma migrate deploy' then 'npm run seed' to reinitialize");

    await pool.end();
  } catch (error) {
    console.error("Error resetting database:", error);
    process.exit(1);
  }
}

resetDatabase();
