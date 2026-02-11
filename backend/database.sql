
-- AI Quiz Portal Database Schema
CREATE DATABASE IF NOT EXISTS ai_quiz_db;
USE ai_quiz_db;

-- 1. Users Table
CREATE TABLE users (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    register_number VARCHAR(20) UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('ADMIN', 'STUDENT') NOT NULL,
    class_year ENUM('1st Year', '2nd Year', '3rd Year'),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Quizzes Table
CREATE TABLE quizzes (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    class_year ENUM('1st Year', '2nd Year', '3rd Year') NOT NULL,
    duration_minutes INT DEFAULT 30,
    max_attempts INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Questions Table
CREATE TABLE questions (
    id VARCHAR(50) PRIMARY KEY,
    quiz_id VARCHAR(50),
    question_text TEXT NOT NULL,
    options_json JSON NOT NULL, -- Stores array of strings
    correct_answer_index INT NOT NULL,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
);

-- 4. Quiz Attempts Table
CREATE TABLE quiz_attempts (
    id VARCHAR(50) PRIMARY KEY,
    quiz_id VARCHAR(50),
    user_id VARCHAR(50),
    user_name VARCHAR(100),
    score INT NOT NULL,
    total_questions INT NOT NULL,
    time_taken_seconds INT NOT NULL,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    answers_json JSON NOT NULL, -- Stores student's selected indices mapped to question IDs
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- --- COMMON QUERIES ---

-- Get all quizes for a specific class
-- SELECT * FROM quizzes WHERE class_year = '2nd Year';

-- Get a student's history with quiz titles
-- SELECT a.*, q.title 
-- FROM quiz_attempts a 
-- JOIN quizzes q ON a.quiz_id = q.id 
-- WHERE a.user_id = 'STUDENT_ID_HERE' 
-- ORDER BY a.completed_at DESC;

-- Get all questions for a quiz
-- SELECT * FROM questions WHERE quiz_id = 'QUIZ_ID_HERE';

-- Insert Admin (Password: Muthu@6319 - Store hashed in real app)
INSERT INTO users (id, name, email, register_number, password, role) 
VALUES ('admin-001', 'Super Admin', 'admin@cs.com', 'ADMIN01', 'Muthu@6319', 'ADMIN');
