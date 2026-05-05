import { pool } from "../src/db/pool";

async function resetDatabase() {
  try {
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
    
    await pool.end();
  } catch (error) {
    console.error("❌ Error resetting database:", error);
    process.exit(1);
  }
}

resetDatabase();
