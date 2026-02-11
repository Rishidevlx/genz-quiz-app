
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables BEFORE importing any other local modules (like db.ts)
dotenv.config({ path: '.env.local' });

const app = express();
const PORT = 3000;

console.log('Environment Check:');
console.log('TIDB_HOST:', process.env.TIDB_HOST);
console.log('TIDB_USER:', process.env.TIDB_USER);
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Exists' : 'Missing');

app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    next();
});

// Helper to wrap Vercel-style handlers for Express
const wrapHandler = (handlerLoader: () => Promise<any>) => async (req: express.Request, res: express.Response) => {
    try {
        const handlerModule = await handlerLoader();
        const handler = handlerModule.default || handlerModule;
        await handler(req, res);
    } catch (error) {
        console.error(error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
};

// Register routes with functional loaders to ensure lazy loading (and thus proper env var availability)
app.post('/api/auth/login', wrapHandler(() => import('../api/auth/login')));
app.post('/api/auth/register', wrapHandler(() => import('../api/auth/register')));

// Quizzes
app.use('/api/quizzes', wrapHandler(() => import('../api/quizzes/index')));

// Attempts
app.use('/api/attempts', wrapHandler(() => import('../api/attempts/index')));

// Users
app.get('/api/users', wrapHandler(() => import('../api/users/index')));

app.listen(PORT, () => {
    console.log(`
    🚀 Local Backend Server running at http://localhost:${PORT}
    
    API Routes:
      - POST /api/auth/login
      - POST /api/auth/register
      - GET/POST /api/quizzes
      - GET/POST /api/attempts
      - GET /api/users
    `);
});
