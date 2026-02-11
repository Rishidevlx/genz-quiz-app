import { createPool } from 'mysql2/promise';
import * as fs from 'fs';
import * as path from 'path';
import 'dotenv/config';

// Load env explicitly if needed, but 'dotenv/config' should handle it if .env is in root
// Note: Since this is a standalone script, we might need to manually load .env.local if dotenv doesn't pick it up automatically
// But for simplicity, let's assume the user runs it with env vars loaded or we parse .env.local manually here
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function migrate() {
    const pool = createPool({
        host: process.env.TIDB_HOST,
        user: process.env.TIDB_USER,
        password: process.env.TIDB_PASSWORD,
        port: Number(process.env.TIDB_PORT) || 4000,
        // database: process.env.TIDB_DATABASE, // Removed to allow creation of DB
        ssl: {
            minVersion: 'TLSv1.2',
            rejectUnauthorized: true
        },
        multipleStatements: true
    });

    try {
        const connection = await pool.getConnection();
        console.log('Connected to TiDB!');

        const sqlPath = path.join(process.cwd(), 'database.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        // Split SQL by commands if needed, but multipleStatements: true handles most cases
        // However, USE command might be weird if we are already connected to a DB or if the DB doesn't exist.
        // Let's just run the whole thing.

        console.log('Executing migration...');
        const [results] = await connection.query(sql);
        console.log('Migration successful!', results);

        connection.release();
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await pool.end();
    }
}

migrate();
