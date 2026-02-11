import { VercelRequest, VercelResponse } from '@vercel/node';
import pool from '../../lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const [rows] = await pool.query<any>('SELECT id, name, email, register_number, role, class_year, created_at FROM users');

        // Map to frontend structure
        const users = rows.map((u: any) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            registerNumber: u.register_number,
            role: u.role,
            classYear: u.class_year
        }));

        return res.status(200).json(users);
    } catch (error) {
        console.error('Fetch users error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
