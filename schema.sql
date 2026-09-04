-- =============================================================
-- Teacher Portal & Exam Management System - Database Schema
-- Database Name: cupe
-- Run: mysql -u root -p cupe < schema.sql
-- =============================================================

CREATE DATABASE IF NOT EXISTS cupe CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE cupe;

-- 1. Users (Manager / Teacher & Students)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('student', 'manager') NOT NULL DEFAULT 'student',
    status ENUM('pending', 'approved') NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Contact Messages (support / feedback form)
CREATE TABLE IF NOT EXISTS contact_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    subject VARCHAR(255) DEFAULT '',
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_contact_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Exams
CREATE TABLE IF NOT EXISTS exams (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    duration_minutes INT NOT NULL DEFAULT 30,
    start_time DATETIME NULL,
    end_time DATETIME NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Questions
CREATE TABLE IF NOT EXISTS questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    exam_id INT NOT NULL,
    question_text TEXT NOT NULL,
    question_type ENUM('multiple_choice', 'structural') NOT NULL DEFAULT 'multiple_choice',
    option_a VARCHAR(255) DEFAULT NULL,
    option_b VARCHAR(255) DEFAULT NULL,
    option_c VARCHAR(255) DEFAULT NULL,
    option_d VARCHAR(255) DEFAULT NULL,
    correct_answer TEXT NOT NULL,
    points INT NOT NULL DEFAULT 1,
    CONSTRAINT fk_question_exam FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Submissions
CREATE TABLE IF NOT EXISTS submissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    exam_id INT NOT NULL,
    student_id INT NOT NULL,
    mcq_score INT DEFAULT 0,
    structural_score INT DEFAULT 0,
    total_score INT DEFAULT 0,
    ai_feedback TEXT,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_sub_exam FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
    CONSTRAINT fk_sub_student FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uq_submission (exam_id, student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Student Answers
CREATE TABLE IF NOT EXISTS student_answers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    submission_id INT NOT NULL,
    question_id INT NOT NULL,
    student_response TEXT,
    is_correct BOOLEAN DEFAULT NULL,
    ai_analysis TEXT,
    CONSTRAINT fk_answer_submission FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE,
    CONSTRAINT fk_answer_question FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. Published Results
CREATE TABLE IF NOT EXISTS published_results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    exam_id INT NOT NULL UNIQUE,
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    published_at TIMESTAMP NULL DEFAULT NULL,
    CONSTRAINT fk_publish_exam FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. Exam Security Logs (anti-proxy / anti-cheat)
CREATE TABLE IF NOT EXISTS exam_security_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    submission_id INT NOT NULL,
    ip_address VARCHAR(45) DEFAULT NULL,
    user_agent TEXT,
    tab_switch_count INT DEFAULT 0,
    flagged_suspicious BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_security_submission FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================================================
-- Default Manager (Teacher) account
-- Email: teacher@cupe.edu   Password: Manager@123
-- =============================================================
INSERT INTO users (full_name, email, password_hash, role, status)
SELECT 'System Manager', 'teacher@cupe.edu', '$2b$10$cz9S.zlr6QIVAESdApVFb.DO.CG.bzho.p5VFBuHxDGdU5ZU7cwi6', 'manager', 'approved'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'teacher@cupe.edu');

UPDATE users
SET password_hash = '$2b$10$cz9S.zlr6QIVAESdApVFb.DO.CG.bzho.p5VFBuHxDGdU5ZU7cwi6',
    role = 'manager',
    status = 'approved'
WHERE email = 'teacher@cupe.edu';

-- =============================================================
-- Sample Exams + Questions (optional seed data)
-- =============================================================

INSERT INTO exams (title, description, duration_minutes, start_time, end_time, is_active) VALUES
('Mathematics Mid-Term', 'Covers Algebra, Geometry and Trigonometry.', 60, NOW(), DATE_ADD(NOW(), INTERVAL 7 DAY), TRUE),
('Physics Quiz 1', 'Kinematics, Forces and Newton\'s Laws.', 30, NOW(), DATE_ADD(NOW(), INTERVAL 7 DAY), TRUE);

INSERT INTO questions (exam_id, question_text, question_type, option_a, option_b, option_c, option_d, correct_answer, points) VALUES
(1, 'What is the value of x in the equation 2x + 4 = 12?', 'multiple_choice', '3', '4', '5', '6', '4', 2),
(1, 'What is the area of a circle with radius 7cm? (Take pi = 3.14)', 'multiple_choice', '143.14 cm²', '153.86 cm²', '163.14 cm²', '173.86 cm²', '153.86 cm²', 3),
(1, 'Explain the Pythagorean theorem and give one real-world application.', 'structural', NULL, NULL, NULL, NULL, 'The square of the hypotenuse equals the sum of squares of the other two sides, used in construction and navigation.', 5),
(2, 'A car accelerates from rest at 2 m/s² for 10 seconds. What is its final velocity?', 'multiple_choice', '10 m/s', '20 m/s', '30 m/s', '40 m/s', '20 m/s', 2),
(2, 'State Newton\'s Second Law and explain how it applies to a falling object.', 'structural', NULL, NULL, NULL, NULL, 'Force equals mass times acceleration; a falling object accelerates at g until air resistance balances gravity (terminal velocity).', 5);

INSERT INTO published_results (exam_id, is_published) VALUES (1, FALSE), (2, FALSE);

-- =============================================================
-- 9. Messages (Teacher -> Student, individual or broadcast)
-- =============================================================
CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sender_id INT NOT NULL,
    subject VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    is_broadcast TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_msg_sender FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS message_recipients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    message_id INT NOT NULL,
    recipient_id INT NOT NULL,
    is_read TINYINT(1) DEFAULT 0,
    read_at TIMESTAMP NULL DEFAULT NULL,
    CONSTRAINT fk_recip_msg FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
    CONSTRAINT fk_recip_user FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uq_recip (message_id, recipient_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;