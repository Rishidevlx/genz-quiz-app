# 🧠 GenZ Quiz App (AI Quiz Pro)

![Banner](https://capsule-render.vercel.app/api?type=waving&color=gradient&height=300&section=header&text=GenZ%20Quiz%20App&fontSize=90&animation=fadeIn&fontAlignY=38&desc=AI-Powered%20Assessment%20Platform%20for%20Modern%20Education&descAlignY=51&descAlign=50)

<div align="center">

[![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![TaiwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB)](https://expressjs.com/)
[![TiDB](https://img.shields.io/badge/TiDB-Serverless-ff0000?style=for-the-badge&logo=tidb&logoColor=white)](https://tidbcloud.com/)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-AI-blue?style=for-the-badge&logo=google&logoColor=white)](https://deepmind.google/technologies/gemini/)

</div>

---

## 🚀 Overview

**GenZ Quiz App** is a next-generation assessment platform designed for educational institutions. It leverages **Google Gemini AI** to automatically generate quizzes based on topics, difficulty, and academic year.

Built with a **Monorepo architecture**, it features a robust **Node.js/Express backend** connected to a scalable **TiDB (MySQL)** database, and a highly responsive **React/Vite frontend**.

## ✨ Key Features

### 🤖 AI-Powered Quiz Generation
-   Just enter a **Topic** (e.g., "Python Loops").
-   Select **Class Year** & **Difficulty**.
-   **Google Gemini AI** instantly creates a structured quiz with multiple-choice questions!

### 👨‍💻 Student Portal
-   Secure Login (Register Number / Email).
-   Real-time Quiz Interface with **Timer**.
-   Instant Results & Score Analysis.

### 🛡️ Admin Dashboard
-   **User Management:** Add/Remove Students.
-   **Quiz Management:** Create AI or Manual Quizzes.
-   **Analytics:** View attempts, scores, and export detailed **Excel Reports**.

### 🔐 Security
-   **JWT (JSON Web Token)** Authentication.
-   **Bcrypt** Password Hashing.
-   **Role-Based Access Control (RBAC)** (Admin vs Student).

---

## 🛠️ Tech Stack

| Component | Technology |
| :--- | :--- |
| **Frontend** | React 19, Vite, TailwindCSS, Lucide Icons |
| **Backend** | Node.js, Express, Vercel Serverless Functions |
| **Database** | TiDB (MySQL Compatible Serverless DB) |
| **AI Engine** | Google Gemini Pro API |
| **Auth** | JWT & Bcrypt |
| **Deployment** | Vercel (Front & Back) |

---

## 🏗️ Project Structure (Monorepo)

```bash
GenZ-Quiz-App/
├── frontend/           # React UI Application
│   ├── src/
│   ├── vite.config.ts
│   └── ...
├── backend/            # Express API Server
│   ├── api/            # API Routes (Vercel ready)
│   ├── lib/            # DB Connection
│   └── ...
└── package.json        # Root config
```

---

## ⚡ Getting Started

### 1. Clone the Repo
```bash
git clone https://github.com/Rishidevlx/genz-quiz-app.git
cd genz-quiz-app
```

### 2. Install Dependencies
```bash
# Install Frontend Deps
cd frontend
npm install

# Install Backend Deps
cd ../backend
npm install
```

### 3. Configure Environment
Create `.env.local` files in both `frontend` and `backend` (see `.env.example`).

### 4. Run Locally (Concurrent)
Open two terminals:

**Terminal 1 (Backend):**
```bash
cd backend
npm run dev
# Runs on http://localhost:3000
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
# Runs on http://localhost:5173
```

---

## 🚢 Deployment

Deployed seamlessly on **Vercel**.
-   **Frontend:** Connects to GitHub -> Root Directory: `frontend`
-   **Backend:** Connects to GitHub -> Root Directory: `backend`

---

<div align="center">

Made with ❤️ by [Rishidevlx](https://github.com/Rishidevlx)

</div>
