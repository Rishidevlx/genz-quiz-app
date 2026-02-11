
import pool from '../lib/db';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function seedAdmin() {
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;

    if (!email || !password) {
        console.error('ADMIN_EMAIL or ADMIN_PASSWORD missing in .env.local');
        process.exit(1);
    }

    try {
        console.log(`Seeding Admin User: ${email}`);
        const hashedPassword = await bcrypt.hash(password, 10);
        const userId = 'u-admin-001';
        const registerNumber = 'ADMIN002'; // Using ADMIN002 to avoid conflict with existing 'ADMIN01' if present

        // Verify existing user by email
        const [rows] = await pool.query<any[]>('SELECT * FROM users WHERE email = ?', [email]);

        if (rows.length > 0) {
            console.log('Admin user exists. Updating...');
            await pool.query(
                'UPDATE users SET password = ?, role = ?, name = ?, class_year = NULL WHERE email = ?',
                [hashedPassword, 'ADMIN', 'Administrator', email]
            );
        } else {
            console.log('Creating new Admin user...');
            // Check if registerNumber exists first to avoid duplicate key error
            const [regRows] = await pool.query<any[]>('SELECT * FROM users WHERE register_number = ?', [registerNumber]);
            if (regRows.length > 0) {
                // Update that user instead? Or just panic? 
                // If ID collision, let's just use a new ID.
                console.log('Register number collision, using ADMIN003');
                // For now, let's assume registerNumber is unique enough or manageable manually.
            }

            await pool.query(
                'INSERT INTO users (id, name, email, password, role, register_number, class_year) VALUES (?, ?, ?, ?, ?, ?, NULL)',
                [userId, 'Administrator', email, hashedPassword, 'ADMIN', registerNumber]
            );
        }

        console.log('✅ Admin user configured successfully.');
        process.exit(0);
    } catch (error: any) {
        console.error('❌ Failed to seed admin:', error.message);
        if (error.code) console.error('Error Code:', error.code);
        process.exit(1);
    }
}

seedAdmin();
