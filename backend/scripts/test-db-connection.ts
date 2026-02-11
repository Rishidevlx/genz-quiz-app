
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function testConnection() {
    console.log('Testing TiDB Connection...');
    console.log('Host:', process.env.TIDB_HOST);
    console.log('User:', process.env.TIDB_USER);
    console.log('Port:', process.env.TIDB_PORT);
    console.log('Database:', process.env.TIDB_DATABASE);

    if (!process.env.TIDB_HOST) {
        console.error('❌ TIDB_HOST is missing!');
        return;
    }

    try {
        const connection = await mysql.createConnection({
            host: process.env.TIDB_HOST,
            user: process.env.TIDB_USER,
            password: process.env.TIDB_PASSWORD,
            database: process.env.TIDB_DATABASE,
            port: Number(process.env.TIDB_PORT) || 4000,
            ssl: {
                minVersion: 'TLSv1.2',
                rejectUnauthorized: true
            }
        });

        console.log('✅ Connection Successful!');
        await connection.end();
    } catch (error: any) {
        console.error('❌ Connection Failed:', error.message);
    }
}

testConnection();
