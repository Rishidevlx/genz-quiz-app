import { User, Quiz, QuizAttempt, ClassYear } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

const getHeaders = () => {
    const userStr = localStorage.getItem('quiz_user');
    const token = userStr ? JSON.parse(userStr).token : '';
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

export const api = {
    auth: {
        login: async (registerNumber: string, password: string): Promise<User> => {
            const res = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ registerNumber, password }),
            });
            if (!res.ok) throw new Error((await res.json()).error);
            const user = await res.json();
            localStorage.setItem('quiz_user', JSON.stringify(user));
            return user;
        },
        register: async (data: any) => {
            const res = await fetch(`${API_BASE}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error((await res.json()).error);
            return res.json();
        },
        logout: () => {
            localStorage.removeItem('quiz_user');
        },
        getCurrentUser: (): User | null => {
            const u = localStorage.getItem('quiz_user');
            return u ? JSON.parse(u) : null;
        }
    },
    quizzes: {
        getAll: async (classYear?: ClassYear): Promise<Quiz[]> => {
            let url = `${API_BASE}/quizzes`;
            if (classYear) url += `?classYear=${classYear}`;

            const res = await fetch(url, { headers: getHeaders() });
            if (!res.ok) throw new Error('Failed to fetch quizzes');
            return res.json();
        },
        create: async (quiz: Quiz) => {
            const res = await fetch(`${API_BASE}/quizzes`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(quiz),
            });
            if (!res.ok) throw new Error('Failed to create quiz');
            return res.json();
        }
    },
    attempts: {
        getByUser: async (userId: string): Promise<QuizAttempt[]> => {
            const res = await fetch(`${API_BASE}/attempts?userId=${userId}`, { headers: getHeaders() });
            if (!res.ok) throw new Error('Failed to fetch attempts');
            return res.json();
        },
        getAll: async (): Promise<QuizAttempt[]> => {
            // Admin fetches all
            const res = await fetch(`${API_BASE}/attempts`, { headers: getHeaders() });
            if (!res.ok) throw new Error('Failed to fetch attempts');
            return res.json();
        },
        save: async (attempt: QuizAttempt) => {
            const res = await fetch(`${API_BASE}/attempts`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(attempt),
            });
            if (!res.ok) throw new Error('Failed to save attempt');
            return res.json();
        }
    },
    users: {
        getAll: async (): Promise<User[]> => {
            const res = await fetch(`${API_BASE}/users`, { headers: getHeaders() });
            if (!res.ok) throw new Error('Failed to fetch users');
            return res.json();
        }
    }
};
