import { VercelRequest, VercelResponse } from '@vercel/node';
import pool from '../../lib/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-change-in-prod';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { registerNumber, password } = req.body;

    if (!registerNumber || !password) {
        return res.status(400).json({ error: 'Missing credentials' });
    }

    try {
        console.log(`[Login] Attempting login for: ${registerNumber}`);

        // Allow login with register number OR email
        const [rows] = await pool.query<any>('SELECT * FROM users WHERE register_number = ? OR email = ?', [registerNumber, registerNumber]);
        console.log(`[Login] DB Query Rows found: ${rows.length}`);

        const user = rows[0];

        if (!user) {
            console.log('[Login] User not found');
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        console.log('[Login] User found:', { id: user.id, email: user.email, hasPassword: !!user.password });

        // Direct password comparison for legacy/demo users if they are not hashed yet
        // In production, you would migrate all to hashed.
        // Here we check: if password matches directly OR if unique hash matches
        let isValid = false;

        // Check if password looks like a bcrypt hash (starts with $2a$ or $2b$)
        if (user.password && user.password.startsWith('$2')) {
            console.log('[Login] Verifying bcrypt hash...');
            isValid = await bcrypt.compare(password, user.password);
        } else {
            // Fallback for plain text (e.g. '123456' or 'Muthu@6319')
            console.log('[Login] Verifying plain text...');
            isValid = user.password === password;
        }

        console.log(`[Login] Password valid: ${isValid}`);

        if (!isValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        console.log('[Login] Signing JWT...');
        const token = jwt.sign(
            { id: user.id, role: user.role, name: user.name, classYear: user.class_year },
            JWT_SECRET,
            { expiresIn: '1d' }
        );
        console.log('[Login] JWT Signed');

        // Return user info (excluding password) and token
        const { password: _, ...userWithoutPass } = user;

        // Normalize keys to camelCase for frontend compatibility
        const frontendUser = {
            id: user.id,
            name: user.name,
            email: user.email,
            registerNumber: user.register_number,
            classYear: user.class_year,
            role: user.role,
            token
        };

        return res.status(200).json(frontendUser);
    } catch (error: any) {
        console.error('Login error detailed:', error);
        console.error('Stack:', error.stack);
        return res.status(500).json({ error: 'Internal server error', details: error.message });
    }
}
