import { initializeDatabase } from "@db/init";
import { logger } from "@config/logger";
import { pool } from "@db/pool";

const run = async () => {
	await initializeDatabase();
	logger.info("Database seed completed");
};

run()
	.then(async () => {
		await pool.end().catch(() => undefined);
		process.exit(0);
	})
	.catch(async (error) => {
		logger.error({ error }, "Database seed failed");
		await pool.end().catch(() => undefined);
		process.exit(1);
	});