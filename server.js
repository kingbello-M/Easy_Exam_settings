require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const PDFDocument = require('pdfkit');
const { GoogleGenAI } = require('@google/genai');

const app = express();
app.use(express.json());

// CORS: allow the dashboard pages to reach the API even when they are opened
// directly from disk (file://) or from a different origin/port.
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
});

// Serve the frontend from the public directory.
app.use(express.static(path.join(__dirname, 'public')));

// Initialize Gemini AI Client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || 'dummy_key' });

// MySQL Connection Pool
const db = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'cupe',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Convert a DateTime value (from an <input type="datetime-local">) into a
// MySQL DATETIME string. Empty / invalid values become NULL.
const toSqlDate = (value) => {
    if (!value) return null;
    const str = String(value).trim();
    if (!str) return null;
    return str.replace('T', ' ').slice(0, 19);
};

// Server-side enforcement of the exam time window.
// Returns an error message string if the window blocks access, otherwise null.
const examWindowError = (exam, now = new Date()) => {
    const start = exam.start_time ? new Date(exam.start_time) : null;
    const end = exam.end_time ? new Date(exam.end_time) : null;
    if (start && now < start) return 'This exam has not started yet. Please wait until the scheduled start time.';
    if (end && now > end) return 'You were not able to enter the exam because the examination time has passed.';
    return null;
};

// Middleware: Authentication Token Check
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ message: 'Access denied. No token provided.' });

    jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret', (err, user) => {
        if (err) return res.status(403).json({ message: 'Invalid or expired token.' });
        req.user = user;
        next();
    });
};

// Middleware: Role Authorization
const requireRole = (role) => {
    return (req, res, next) => {
        if (req.user.role !== role) {
            return res.status(403).json({ message: `Forbidden: Requires ${role} access.` });
        }
        next();
    };
};

// ==================== AUTH ROUTES ====================

app.post('/api/auth/register', async (req, res) => {
    const { full_name, email, password, role } = req.body;

    if (!full_name || !email || !password) {
        return res.status(400).json({ message: 'Please provide all required fields.' });
    }

    try {
        const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ message: 'Email address already registered.' });
        }

        const password_hash = await bcrypt.hash(password, 10);
        const userRole = role === 'manager' ? 'manager' : 'student';
        const status = 'approved';

        await db.query(
            'INSERT INTO users (full_name, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?)',
            [full_name, email, password_hash, userRole, status]
        );

        res.status(201).json({
            message: userRole === 'student'
                ? 'Account created successfully! You can now sign in.'
                : 'Manager account registered successfully!'
        });
    } catch (error) {
        console.error('Registration Error:', error);
        res.status(500).json({ message: 'Server error during registration.' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(400).json({ message: 'Invalid email or password.' });
        }

        const user = users[0];

        if (user.status !== 'approved') {
            return res.status(403).json({ message: 'Your account is not active. Please contact your teacher.' });
        }

        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(400).json({ message: 'Invalid email or password.' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '12h' }
        );

        res.json({ token, role: user.role, user_id: user.id, full_name: user.full_name, email: user.email });
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ message: 'Server error during login.' });
    }
});

// ==================== CONTACT ROUTES ====================

app.post('/api/contact', async (req, res) => {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !message) {
        return res.status(400).json({ message: 'Please provide your name, email and a message.' });
    }

    try {
        await db.query(
            'INSERT INTO contact_messages (sender_name, sender_email, subject, message) VALUES (?, ?, ?, ?)',
            [name, email, subject || '', message]
        );
        res.status(201).json({ message: 'Message sent successfully.' });
    } catch (error) {
        console.error('Contact Error:', error);
        res.status(500).json({ message: 'Server error while saving your message.' });
    }
});

// ==================== TEACHER EXAM & SETTINGS ROUTES ====================

// Teacher: view all submissions/results across exams
app.get('/api/teacher/all-results', authenticateToken, requireRole('manager'), async (req, res) => {
    try {
        let sql = `SELECT s.id, s.total_score, s.mcq_score, s.structural_score, s.submitted_at,
                    u.full_name AS student_name, u.email, e.title AS exam_title
             FROM submissions s
             JOIN users u ON s.student_id = u.id
             JOIN exams e ON s.exam_id = e.id`;
        const params = [];
        if (req.query.exam_id) {
            sql += ' WHERE s.exam_id = ?';
            params.push(req.query.exam_id);
        }
        sql += ' ORDER BY e.title ASC, u.full_name ASC';
        const [results] = await db.query(sql, params);
        const enriched = results.map((r) => ({
            ...r,
            total_score: r.total_score || 0,
            mcq_score: r.mcq_score || 0,
            structural_score: r.structural_score || 0
        }));
        res.json(enriched);
    } catch (error) {
        console.error('All results error:', error);
        res.status(500).json({ message: 'Error fetching results.' });
    }
});

// Teacher: download results as a PDF file
app.get('/api/teacher/results/pdf', authenticateToken, requireRole('manager'), async (req, res) => {
    try {
        let sql = `SELECT s.id, s.total_score, s.mcq_score, s.structural_score, s.submitted_at,
                    u.full_name AS student_name, u.email, e.title AS exam_title
             FROM submissions s
             JOIN users u ON s.student_id = u.id
             JOIN exams e ON s.exam_id = e.id`;
        const params = [];
        let filterExam = null;
        if (req.query.exam_id) {
            sql += ' WHERE s.exam_id = ?';
            filterExam = req.query.exam_id;
            params.push(filterExam);
        }
        sql += ' ORDER BY e.title ASC, u.full_name ASC';
        const [results] = await db.query(sql, params);

        let title = 'CUPE - Examination Results';
        if (filterExam) {
            const [examRows] = await db.query('SELECT title FROM exams WHERE id = ?', [filterExam]);
            if (examRows.length) title = 'CUPE - ' + examRows[0].title + ' Results';
        }

        const filename = 'results-report-' + new Date().toISOString().slice(0, 10) + '.pdf';

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="' + filename + '"');

        const doc = new PDFDocument({ size: 'A4', margin: 48 });
        doc.pipe(res);

        const now = new Date();
        const dateStr = now.toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' }) +
            ' at ' + now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

        const pageWidth = doc.page.width - 96;

        doc.rect(0, 0, doc.page.width, 78).fill('#2563eb');
        doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(18).text('CUPE Academic Portal', 48, 24);
        doc.font('Helvetica').fontSize(11).text('Examination Results Report', 48, 48);
        doc.font('Helvetica-Bold').fontSize(13).fillColor('#111827')
            .text(title, 48, 100, { width: pageWidth });
        doc.font('Helvetica').fontSize(10).fillColor('#4b5563')
            .text('Generated on ' + dateStr + '  |  Total students: ' + results.length, 48, 118, { width: pageWidth });

        doc.moveDown(5);

        if (!results.length) {
            doc.font('Helvetica-Oblique').fontSize(11).fillColor('#4b5563')
                .text('No results have been recorded yet.', 48, 150);
        } else {
            const headers = ['#', 'Student Full Name', 'Exam', 'MCQ', 'Structural', 'Total'];
            const cols = [28, pageWidth * 0.30, pageWidth * 0.32, 60, 80, 60];
            const rowHeight = 24;
            let y = 150;
            let even = false;

            const drawCell = (text, colIdx, opt) => {
                doc.font(opt && opt.bold ? 'Helvetica-Bold' : 'Helvetica');
                if (opt && opt.white) doc.fillColor('#ffffff');
                else if (opt && opt.head) doc.fillColor('#111827');
                else doc.fillColor('#111827');
                const x = cols.slice(0, colIdx).reduce((a, b) => a + b, 0) + 48;
                const w = cols[colIdx];
                const align = colIdx >= 3 ? 'right' : 'left';
                doc.text(text, x, y + (rowHeight - 10) / 2, { width: w, align, ellipsis: true });
            };

            // header row
            doc.rect(48, y - 6, pageWidth, rowHeight).fill('#1e3a8a');
            headers.forEach((h, i) => drawCell(h, i, { head: true, white: true }));
            y += rowHeight;

            results.forEach((r, idx) => {
                if (y > doc.page.height - 70) {
                    doc.addPage();
                    y = 60;
                }
                if (even) doc.rect(48, y - 6, pageWidth, rowHeight).fill('#eef2ff');
                const cells = [
                    String(idx + 1),
                    r.student_name || '-',
                    r.exam_title || '-',
                    String(r.mcq_score),
                    String(r.structural_score),
                    String(r.total_score)
                ];
                cells.forEach((c, i) => drawCell(c, i));
                even = !even;
                y += rowHeight;
            });

            // totals footer
            if (y > doc.page.height - 70) { doc.addPage(); y = 60; }
            y += 10;
            doc.moveTo(48, y - 6).lineTo(48 + pageWidth, y - 6).lineWidth(1).stroke('#c7d2fe');
            y += 6;
            const sumMcq = results.reduce((a, r) => a + (r.mcq_score || 0), 0);
            const sumStruct = results.reduce((a, r) => a + (r.structural_score || 0), 0);
            const sumTotal = results.reduce((a, r) => a + (r.total_score || 0), 0);
            const totals = ['', 'Overall Totals', '', String(sumMcq), String(sumStruct), String(sumTotal)];
            doc.font('Helvetica-Bold').fontSize(10).fillColor('#1e3a8a');
            totals.forEach((c, i) => {
                const x = cols.slice(0, i).reduce((a, b) => a + b, 0) + 48;
                const w = cols[i];
                const align = i >= 3 ? 'right' : 'left';
                doc.text(c, x, y, { width: w, align });
            });
        }

        doc.end();
    } catch (error) {
        console.error('PDF generation error:', error);
        if (!res.headersSent) res.status(500).json({ message: 'Error generating PDF.' });
        else res.end();
    }
});

// Create a new exam with questions
app.post('/api/teacher/create-exam', authenticateToken, requireRole('manager'), async (req, res) => {
    const { title, description, duration_minutes, start_time, end_time, questions } = req.body;

    if (!title) return res.status(400).json({ message: 'Exam title is required.' });

    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const [examResult] = await conn.query(
            'INSERT INTO exams (title, description, duration_minutes, start_time, end_time) VALUES (?, ?, ?, ?, ?)',
            [title, description || '', parseInt(duration_minutes) || 30, toSqlDate(start_time), toSqlDate(end_time)]
        );
        const examId = examResult.insertId;

        if (Array.isArray(questions) && questions.length) {
            for (const q of questions) {
                const optionsJson = q.options && Object.keys(q.options).length ? JSON.stringify(q.options) : null;
                await conn.query(
                    'INSERT INTO questions (exam_id, question_text, question_type, options, correct_answer, points) VALUES (?, ?, ?, ?, ?, ?)',
                    [examId, q.question_text, q.question_type || 'multiple_choice', optionsJson, q.correct_answer || '', parseInt(q.points) || 1]
                );
            }
        }

        await conn.commit();
        res.status(201).json({ message: 'Exam created successfully.', exam_id: examId });
    } catch (error) {
        await conn.rollback();
        console.error('Create exam error:', error);
        res.status(500).json({ message: 'Failed to create exam.' });
    } finally {
        conn.release();
    }
});

// Teacher: get all exams with question & submission counts
app.get('/api/teacher/exams/all', authenticateToken, requireRole('manager'), async (req, res) => {
    try {
        const [exams] = await db.query(
            `SELECT e.id, e.title, e.description, e.duration_minutes, e.start_time, e.end_time, e.created_at,
                    (SELECT COUNT(*) FROM questions q WHERE q.exam_id = e.id) AS question_count,
                    (SELECT COUNT(*) FROM submissions s WHERE s.exam_id = e.id) AS submissions,
                    COALESCE(pr.is_published, 0) AS is_published
             FROM exams e
             LEFT JOIN published_results pr ON pr.exam_id = e.id
             ORDER BY e.created_at DESC`
        );
        res.json(exams);
    } catch (error) {
        console.error('Fetch all exams error:', error);
        res.status(500).json({ message: 'Error fetching exams.' });
    }
});

// Teacher: get exam detail with questions (for editing/creating)
app.get('/api/teacher/exam/:id', authenticateToken, requireRole('manager'), async (req, res) => {
    try {
        const [exams] = await db.query('SELECT * FROM exams WHERE id = ?', [req.params.id]);
        if (!exams.length) return res.status(404).json({ message: 'Exam not found.' });
        const [questions] = await db.query('SELECT id, question_text, question_type, options, correct_answer, points FROM questions WHERE exam_id = ?', [req.params.id]);
        const parsed = questions.map((q) => {
            let opts = {};
            try { opts = typeof q.options === 'string' ? JSON.parse(q.options) : (q.options || {}); } catch (e) { opts = {}; }
            return { ...q, options: opts };
        });
        res.json({ ...exams[0], questions: parsed });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching exam.' });
    }
});

// Teacher: update exam details
app.put('/api/teacher/exam/:id', authenticateToken, requireRole('manager'), async (req, res) => {
    const { title, description, duration_minutes, start_time, end_time } = req.body;
    try {
        await db.query(
            'UPDATE exams SET title = ?, description = ?, duration_minutes = ?, start_time = ?, end_time = ? WHERE id = ?',
            [title, description || '', parseInt(duration_minutes) || 30, toSqlDate(start_time), toSqlDate(end_time), req.params.id]
        );
        res.json({ message: 'Exam updated.' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating exam.' });
    }
});

// Teacher: toggle exam publish status
app.put('/api/teacher/exam/:id/publish', authenticateToken, requireRole('manager'), async (req, res) => {
    const { is_published } = req.body;
    try {
        await db.query(
            'INSERT INTO published_results (exam_id, is_published, published_at) VALUES (?, ?, NOW()) ON DUPLICATE KEY UPDATE is_published = ?, published_at = NOW()',
            [req.params.id, is_published ? 1 : 0, is_published ? 1 : 0]
        );
        res.json({ message: is_published ? 'Exam published.' : 'Exam set to draft.' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating publication status.' });
    }
});

// Teacher: delete an exam
app.delete('/api/teacher/exam/:id', authenticateToken, requireRole('manager'), async (req, res) => {
    try {
        await db.query('DELETE FROM exams WHERE id = ?', [req.params.id]);
        res.json({ message: 'Exam deleted.' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting exam.' });
    }
});

// Teacher: dashboard statistics
app.get('/api/teacher/stats', authenticateToken, requireRole('manager'), async (req, res) => {
    try {
        const [[students]] = await db.query('SELECT COUNT(*) AS total FROM users WHERE role = "student"');
        const [[pending]] = await db.query('SELECT COUNT(*) AS total FROM users WHERE role = "student" AND status = "pending"');
        const [[exams]] = await db.query('SELECT COUNT(*) AS total FROM exams');
        const [[submissions]] = await db.query('SELECT COUNT(*) AS total FROM submissions');
        const [[unreadContacts]] = await db.query('SELECT COUNT(*) AS total FROM contact_messages WHERE is_read = 0');
        const [[avgScore]] = await db.query('SELECT COALESCE(AVG(s.total_score), 0) AS avg FROM submissions s');
        res.json({
            students: students.total,
            pending: pending.total,
            exams: exams.total,
            submissions: submissions.total,
            unread_contacts: unreadContacts.total,
            avg_score: Math.round(avgScore.avg)
        });
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ message: 'Error fetching statistics.' });
    }
});

// Teacher: update own profile (settings)
app.put('/api/teacher/profile', authenticateToken, requireRole('manager'), async (req, res) => {
    const { full_name, email } = req.body;
    try {
        if (!full_name) return res.status(400).json({ message: 'Name is required.' });
        await db.query('UPDATE users SET full_name = ?, email = ? WHERE id = ?', [full_name, email || req.user.email, req.user.id]);
        res.json({ message: 'Profile updated.' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') return res.status(400).json({ message: 'Email already in use.' });
        res.status(500).json({ message: 'Error updating profile.' });
    }
});

// Teacher: get own profile
app.get('/api/teacher/profile', authenticateToken, requireRole('manager'), async (req, res) => {
    try {
        const [rows] = await db.query('SELECT id, full_name, email, role FROM users WHERE id = ?', [req.user.id]);
        if (!rows.length) return res.status(404).json({ message: 'User not found.' });
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching profile.' });
    }
});

// Teacher: change password
app.put('/api/teacher/change-password', authenticateToken, requireRole('manager'), async (req, res) => {
    const { current_password, new_password } = req.body;
    try {
        const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [req.user.id]);
        if (!rows.length) return res.status(404).json({ message: 'User not found.' });
        const valid = await bcrypt.compare(current_password, rows[0].password_hash);
        if (!valid) return res.status(400).json({ message: 'Current password is incorrect.' });
        const hash = await bcrypt.hash(new_password, 10);
        await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, req.user.id]);
        res.json({ message: 'Password changed successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Error changing password.' });
    }
});

// Teacher: get contact messages
app.get('/api/teacher/contacts', authenticateToken, requireRole('manager'), async (req, res) => {
    try {
        const [messages] = await db.query('SELECT id, sender_name, sender_email, subject, message, is_read, submitted_at FROM contact_messages ORDER BY submitted_at DESC');
        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching contact messages.' });
    }
});

// Teacher: mark contact message as read
app.put('/api/teacher/contact/:id/read', authenticateToken, requireRole('manager'), async (req, res) => {
    try {
        await db.query('UPDATE contact_messages SET is_read = 1 WHERE id = ?', [req.params.id]);
        res.json({ message: 'Marked as read.' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating contact message.' });
    }
});

// ==================== MESSAGING ROUTES ====================

// Get all approved students (for teacher messaging)
app.get('/api/teacher/students', authenticateToken, requireRole('manager'), async (req, res) => {
    try {
        const [students] = await db.query(
            'SELECT id, full_name, email FROM users WHERE role = "student" ORDER BY full_name'
        );
        res.json(students);
    } catch (error) {
        console.error('Fetch students error:', error);
        res.status(500).json({ message: 'Error fetching students.' });
    }
});

app.delete('/api/teacher/student/:id', authenticateToken, requireRole('manager'), async (req, res) => {
    const studentId = req.params.id;
    try {
        const [student] = await db.query('SELECT id FROM users WHERE id = ? AND role = "student"', [studentId]);
        if (!student.length) return res.status(404).json({ message: 'Student not found.' });
        await db.query('DELETE FROM users WHERE id = ?', [studentId]);
        res.json({ message: 'Student deleted successfully.' });
    } catch (error) {
        console.error('Delete student error:', error);
        res.status(500).json({ message: 'Error deleting student.' });
    }
});

// Send a message to all students (broadcast) or to a specific student
app.post('/api/teacher/send-message', authenticateToken, requireRole('manager'), async (req, res) => {
    const { subject, body, recipient_id } = req.body;
    const sender_id = req.user.id;

    if (!subject || !body) {
        return res.status(400).json({ message: 'Subject and message are required.' });
    }

    // recipient_id: null/undefined means broadcast to all students.
    const broadcast = !recipient_id;

    try {
        const [msgResult] = await db.query(
            'INSERT INTO messages (sender_id, subject, body, is_broadcast) VALUES (?, ?, ?, ?)',
            [sender_id, subject, body, broadcast ? 1 : 0]
        );
        const messageId = msgResult.insertId;

        if (broadcast) {
            const [students] = await db.query('SELECT id FROM users WHERE role = "student"');
            for (const s of students) {
                await db.query(
                    'INSERT INTO message_recipients (message_id, recipient_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE message_id = message_id',
                    [messageId, s.id]
                );
            }
        } else {
            await db.query(
                'INSERT INTO message_recipients (message_id, recipient_id) VALUES (?, ?)',
                [messageId, recipient_id]
            );
        }

        res.status(201).json({ message: broadcast ? 'Message sent to all students.' : 'Message sent to student.' });
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ message: 'Error sending message.' });
    }
});

// Teacher sees all messages they have sent (with recipient counts)
app.get('/api/teacher/messages', authenticateToken, requireRole('manager'), async (req, res) => {
    try {
        const [messages] = await db.query(
            `SELECT m.id, m.subject, m.body, m.is_broadcast, m.created_at,
                    (SELECT COUNT(*) FROM message_recipients mr WHERE mr.message_id = m.id) AS recipients,
                    (SELECT COUNT(*) FROM message_recipients mr WHERE mr.message_id = m.id AND mr.is_read = 1) AS read_count
             FROM messages m
             WHERE m.sender_id = ?
             ORDER BY m.created_at DESC`,
            [req.user.id]
        );
        res.json(messages);
    } catch (error) {
        console.error('Fetch teacher messages error:', error);
        res.status(500).json({ message: 'Error fetching messages.' });
    }
});

// Delete a message by teacher
app.delete('/api/teacher/message/:id', authenticateToken, requireRole('manager'), async (req, res) => {
    try {
        await db.query('DELETE FROM messages WHERE id = ? AND sender_id = ?', [req.params.id, req.user.id]);
        res.json({ message: 'Message deleted.' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting message.' });
    }
});

// Student: get their inbox and mark unread count
app.get('/api/student/messages', authenticateToken, requireRole('student'), async (req, res) => {
    try {
        const [messages] = await db.query(
            `SELECT m.id, m.subject, m.body, m.is_broadcast, m.created_at,
                    u.full_name AS sender_name, mr.is_read, mr.id AS recipient_row
             FROM message_recipients mr
             JOIN messages m ON mr.message_id = m.id
             JOIN users u ON m.sender_id = u.id
             WHERE mr.recipient_id = ?
             ORDER BY m.created_at DESC`,
            [req.user.id]
        );
        const [countResult] = await db.query(
            'SELECT COUNT(*) AS unread FROM message_recipients WHERE recipient_id = ? AND is_read = 0',
            [req.user.id]
        );
        res.json({ messages, unread: countResult[0].unread });
    } catch (error) {
        console.error('Fetch student messages error:', error);
        res.status(500).json({ message: 'Error fetching messages.' });
    }
});

// Student: mark a message as read
app.put('/api/student/message/:id/read', authenticateToken, requireRole('student'), async (req, res) => {
    try {
        await db.query(
            'UPDATE message_recipients SET is_read = 1, read_at = NOW() WHERE id = ? AND recipient_id = ?',
            [req.params.id, req.user.id]
        );
        res.json({ message: 'Message marked as read.' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating message.' });
    }
});

// ==================== TEACHER / MANAGER ROUTES ====================

app.post('/api/teacher/add-student', authenticateToken, requireRole('manager'), async (req, res) => {
    const { full_name, email } = req.body;

    try {
        const tempPasswordHash = await bcrypt.hash('Student@123', 10);
        await db.query(
            'INSERT INTO users (full_name, email, password_hash, role, status) VALUES (?, ?, ?, "student", "approved")',
            [full_name, email, tempPasswordHash]
        );
        res.status(201).json({ message: 'Student created successfully. Default password is: Student@123' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'Student email already exists.' });
        }
        res.status(500).json({ message: 'Failed to create student.' });
    }
});

app.get('/api/teacher/pending-students', authenticateToken, requireRole('manager'), async (req, res) => {
    try {
        const [students] = await db.query(
            'SELECT id, full_name, email, created_at FROM users WHERE role = "student" AND status = "pending"'
        );
        res.json(students);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching pending students.' });
    }
});

app.put('/api/teacher/approve-student/:id', authenticateToken, requireRole('manager'), async (req, res) => {
    try {
        await db.query('UPDATE users SET status = "approved" WHERE id = ?', [req.params.id]);
        res.json({ message: 'Student approved successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Error approving student.' });
    }
});

// AI Auto-Grading & Results Release
app.post('/api/teacher/distribute-results/:examId', authenticateToken, requireRole('manager'), async (req, res) => {
    const { examId } = req.params;

    try {
        const [submissions] = await db.query('SELECT * FROM submissions WHERE exam_id = ?', [examId]);

        for (const sub of submissions) {
            const [answers] = await db.query(
                `SELECT sa.id as answer_id, sa.student_response, q.question_text, q.question_type, q.correct_answer, q.points
         FROM student_answers sa
         JOIN questions q ON sa.question_id = q.id
         WHERE sa.submission_id = ?`,
                [sub.id]
            );

            let mcqScore = 0;
            let structuralScore = 0;
            let evaluationSummary = [];

            for (const ans of answers) {
                if (ans.question_type === 'multiple_choice') {
                    const isCorrect = ans.student_response.trim().toLowerCase() === ans.correct_answer.trim().toLowerCase();
                    const earnedPoints = isCorrect ? ans.points : 0;
                    mcqScore += earnedPoints;

                    await db.query(
                        'UPDATE student_answers SET is_correct = ?, ai_analysis = ? WHERE id = ?',
                        [isCorrect, isCorrect ? 'Correct choice.' : 'Incorrect choice.', ans.answer_id]
                    );
                } else if (ans.question_type === 'structural') {
                    const prompt = `
            You are an educational grading assistant.
            Question: "${ans.question_text}"
            Teacher's Correct Key: "${ans.correct_answer}"
            Student's Response: "${ans.student_response}"
            Max Points: ${ans.points}

            Evaluate the student response against the key.
            Return JSON only: {"awarded_points": <number>, "feedback": "<1-2 sentence feedback>"}
          `;

                    let awardedPoints = 0;
                    let feedbackText = 'Evaluated.';

                    try {
                        const aiResponse = await ai.models.generateContent({
                            model: 'gemini-2.5-flash',
                            contents: prompt
                        });

                        const cleanJson = aiResponse.text.replace(/```json|```/g, '').trim();
                        const parsed = JSON.parse(cleanJson);
                        awardedPoints = parsed.awarded_points || 0;
                        feedbackText = parsed.feedback || 'Evaluated.';
                    } catch (aiErr) {
                        console.error('AI Fallback trigger:', aiErr);
                        const simpleMatch = ans.student_response.toLowerCase().includes(ans.correct_answer.toLowerCase());
                        awardedPoints = simpleMatch ? ans.points : 0;
                        feedbackText = simpleMatch ? 'Matched answer key keywords.' : 'Does not match key.';
                    }

                    structuralScore += awardedPoints;
                    evaluationSummary.push(`Q: "${ans.question_text}" -> ${feedbackText}`);

                    await db.query(
                        'UPDATE student_answers SET is_correct = ?, ai_analysis = ? WHERE id = ?',
                        [awardedPoints > 0, feedbackText, ans.answer_id]
                    );
                }
            }

            const totalScore = mcqScore + structuralScore;
            const overallDiagnostic = evaluationSummary.length > 0
                ? evaluationSummary.join(' | ')
                : `Final Score: ${totalScore}. Correct performance across multiple-choice questions.`;

            await db.query(
                'UPDATE submissions SET mcq_score = ?, structural_score = ?, total_score = ?, ai_feedback = ? WHERE id = ?',
                [mcqScore, structuralScore, totalScore, overallDiagnostic, sub.id]
            );
        }

        await db.query(
            'INSERT INTO published_results (exam_id, is_published, published_at) VALUES (?, TRUE, NOW()) ON DUPLICATE KEY UPDATE is_published = TRUE, published_at = NOW()',
            [examId]
        );

        res.json({ message: 'All submissions evaluated by AI and results published!' });
    } catch (error) {
        console.error('Distribution Error:', error);
        res.status(500).json({ message: 'Error processing results.' });
    }
});

// ==================== STUDENT ROUTES ====================

app.get('/api/student/exams', authenticateToken, requireRole('student'), async (req, res) => {
    try {
        const [exams] = await db.query(
            'SELECT id, title, description, duration_minutes, start_time, end_time FROM exams'
        );
        res.json(exams);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching exams.' });
    }
});

app.post('/api/student/submit-exam', authenticateToken, requireRole('student'), async (req, res) => {
    const { exam_id, answers, tab_switches } = req.body;
    const student_id = req.user.id;
    const clientIp = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'] || 'Unknown Browser';

    try {
        const [examRows] = await db.query('SELECT * FROM exams WHERE id = ?', [exam_id]);
        if (!examRows.length) return res.status(404).json({ message: 'Exam not found.' });

        const windowErr = examWindowError(examRows[0]);
        if (windowErr) {
            if (examRows[0].end_time && new Date() > new Date(examRows[0].end_time)) {
                return res.status(403).json({ message: 'The exam time has passed. Your answers could not be submitted.' });
            }
            return res.status(403).json({ message: windowErr });
        }

        const [subResult] = await db.query(
            'INSERT INTO submissions (exam_id, student_id) VALUES (?, ?)',
            [exam_id, student_id]
        );

        const submissionId = subResult.insertId;

        for (const ans of answers) {
            await db.query(
                'INSERT INTO student_answers (submission_id, question_id, student_response) VALUES (?, ?, ?)',
                [submissionId, ans.question_id, ans.response]
            );
        }

        await db.query(
            'INSERT INTO exam_security_logs (submission_id, ip_address, user_agent, tab_switch_count, flagged_suspicious) VALUES (?, ?, ?, ?, ?)',
            [submissionId, clientIp, userAgent, tab_switches || 0, tab_switches > 3]
        );

        res.status(201).json({ message: 'Exam submitted successfully!' });
    } catch (error) {
        console.error('Submission Error:', error);
        res.status(500).json({ message: 'Failed to record exam.' });
    }
});

app.get('/api/student/my-results', authenticateToken, requireRole('student'), async (req, res) => {
    const student_id = req.user.id;

    try {
        const [results] = await db.query(
            `SELECT e.title as exam_title, s.total_score, s.ai_feedback, pr.published_at
       FROM submissions s
       JOIN exams e ON s.exam_id = e.id
       JOIN published_results pr ON e.id = pr.exam_id
       WHERE s.student_id = ? AND pr.is_published = TRUE`,
            [student_id]
        );

        res.json(results);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching exam results.' });
    }
});

app.get('/api/health', async (req, res) => {
    try {
        await db.query('SELECT 1');
        res.json({ ok: true, database: process.env.DB_NAME || 'cupe' });
    } catch (error) {
        console.error('Database health check failed:', error);
        res.status(503).json({ ok: false, message: 'Database connection unavailable.' });
    }
});

app.get('/api/teacher/exams-status', authenticateToken, requireRole('manager'), async (req, res) => {
    try {
        const [exams] = await db.query(
            `SELECT e.id, e.title, COUNT(s.id) AS submissions,
                    COALESCE(pr.is_published, FALSE) AS is_published
             FROM exams e
             LEFT JOIN submissions s ON s.exam_id = e.id
             LEFT JOIN published_results pr ON pr.exam_id = e.id
             GROUP BY e.id, e.title, pr.is_published
             ORDER BY e.created_at DESC`
        );
        res.json(exams);
    } catch (error) {
        console.error('Exam status error:', error);
        res.status(500).json({ message: 'Error fetching exam status.' });
    }
});

app.get('/api/student/exams/:id', authenticateToken, requireRole('student'), async (req, res) => {
    try {
        const [exams] = await db.query(
            'SELECT id, title, description, duration_minutes, start_time, end_time FROM exams WHERE id = ?',
            [req.params.id]
        );
        if (exams.length === 0) return res.status(404).json({ message: 'Exam not found.' });

        const windowErr = examWindowError(exams[0]);
        if (windowErr) {
            return res.status(403).json({ code: 'exam_window', message: windowErr });
        }

        const [questions] = await db.query(
            `SELECT id, question_text, question_type, options, correct_answer, points
             FROM questions WHERE exam_id = ? ORDER BY id`,
            [req.params.id]
        );
        const questionsParsed = questions.map((q) => {
            let opts = {};
            try {
                opts = typeof q.options === 'string' ? JSON.parse(q.options) : (q.options || {});
            } catch (e) {
                opts = {};
            }
            return { ...q, options: opts };
        });
        res.json({ ...exams[0], questions: questionsParsed });
    } catch (error) {
        console.error('Exam detail error:', error);
        res.status(500).json({ message: 'Error fetching exam questions.' });
    }
});

// Serve the login and dashboard pages directly from the public folder.
app.get('/login.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});
app.get('/teacher-dashboard.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'teacher-dashboard.html'));
});
app.get('/student-dashboard.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'student-dashboard.html'));
});

// Serve the login page for browser routes that are not API endpoints.
app.get('*splat', (req, res) => {
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ message: 'API endpoint not found.' });
    }

    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
