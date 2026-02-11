import { VercelRequest, VercelResponse } from '@vercel/node';
import pool from '../../lib/db';
import bcrypt from 'bcryptjs';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { name, registerNumber, password, classYear, email, role = 'STUDENT' } = req.body;

    if (!name || !registerNumber || !password) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        // Check if user exists
        const [existing] = await pool.query<any>('SELECT id FROM users WHERE register_number = ?', [registerNumber]);
        if (existing.length > 0) {
            return res.status(409).json({ error: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const id = `u-${Date.now()}`; // Simple ID generation

        await pool.query(
            'INSERT INTO users (id, name, register_number, password, class_year, email, role) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [id, name, registerNumber, hashedPassword, classYear, email, role]
        );

        return res.status(201).json({ message: 'User created successfully', id });
    } catch (error) {
        console.error('Register error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
