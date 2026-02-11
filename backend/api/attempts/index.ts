import { VercelRequest, VercelResponse } from '@vercel/node';
import pool from '../../lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method === 'GET') {
        try {
            const { userId } = req.query;
            let query = 'SELECT * FROM quiz_attempts';
            let params = [];

            if (userId) {
                query += ' WHERE user_id = ?';
                params.push(userId);
            }

            const [rows] = await pool.query<any>(query, params);

            // Map to frontend structure
            const attempts = rows.map((row: any) => ({
                id: row.id,
                quizId: row.quiz_id,
                userId: row.user_id,
                userName: row.user_name,
                score: row.score,
                totalQuestions: row.total_questions,
                timeTaken: row.time_taken_seconds,
                completedAt: row.completed_at,
                answers: typeof row.answers_json === 'string' ? JSON.parse(row.answers_json) : row.answers_json
            }));

            return res.status(200).json(attempts);
        } catch (error) {
            console.error('Fetch attempts error:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    if (req.method === 'POST') {
        const { id, quizId, userId, userName, score, totalQuestions, timeTaken, answers } = req.body;

        try {
            await pool.query(
                'INSERT INTO quiz_attempts (id, quiz_id, user_id, user_name, score, total_questions, time_taken_seconds, answers_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [id, quizId, userId, userName, score, totalQuestions, timeTaken, JSON.stringify(answers)]
            );
            return res.status(201).json({ message: 'Attempt saved' });
        } catch (error) {
            console.error('Save attempt error:', error);
            return res.status(500).json({ error: 'Failed to save attempt' });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
