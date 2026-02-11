import { VercelRequest, VercelResponse } from '@vercel/node';
import pool from '../../lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method === 'GET') {
        try {
            // Fetch all quizzes (or filter by classYear if query param exists)
            // For now, simpler to fetch all and filter on frontend or add simple WHERE
            const { classYear } = req.query;
            let query = 'SELECT * FROM quizzes';
            let params = [];

            if (classYear) {
                query += ' WHERE class_year = ?';
                params.push(classYear);
            }

            const [quizzes] = await pool.query<any>(query, params);

            // We also need questions for these quizzes. 
            // In a real app we might fetch them separately or join.
            // For this demo, we'll fetch questions for each quiz or fetch all questions and map.
            // Let's fetch all questions and map them to quizzes to match the existing frontend structure.
            const [questions] = await pool.query<any>('SELECT * FROM questions');

            const fullQuizzes = quizzes.map((q: any) => ({
                id: q.id,
                title: q.title,
                description: q.description,
                classYear: q.class_year,
                durationMinutes: q.duration_minutes,
                maxAttempts: q.max_attempts,
                createdAt: q.created_at,
                questions: questions.filter((ques: any) => ques.quiz_id === q.id).map((ques: any) => ({
                    id: ques.id,
                    text: ques.question_text,
                    options: typeof ques.options_json === 'string' ? JSON.parse(ques.options_json) : ques.options_json,
                    correctAnswer: ques.correct_answer_index
                }))
            }));

            return res.status(200).json(fullQuizzes);
        } catch (error) {
            console.error('Fetch quizzes error:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    if (req.method === 'POST') {
        // Creating a new quiz
        const { id, title, description, classYear, durationMinutes, maxAttempts, questions } = req.body;

        // Validate
        if (!title || !classYear) return res.status(400).json({ error: 'Missing required fields' });

        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            await connection.query(
                'INSERT INTO quizzes (id, title, description, class_year, duration_minutes, max_attempts) VALUES (?, ?, ?, ?, ?, ?)',
                [id, title, description, classYear, durationMinutes, maxAttempts]
            );

            // Insert questions
            if (questions && questions.length > 0) {
                for (const q of questions) {
                    await connection.query(
                        'INSERT INTO questions (id, quiz_id, question_text, options_json, correct_answer_index) VALUES (?, ?, ?, ?, ?)',
                        [q.id, id, q.text, JSON.stringify(q.options), q.correctAnswer]
                    );
                }
            }

            await connection.commit();
            return res.status(201).json({ message: 'Quiz created' });
        } catch (error) {
            await connection.rollback();
            console.error('Create quiz error:', error);
            return res.status(500).json({ error: 'Failed to create quiz' });
        } finally {
            connection.release();
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
