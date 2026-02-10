console.log('--- SERVER.JS INITIALIZING ---');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./database');
const fs = require('fs');
const multer = require('multer');
require('dotenv').config();
const upload = multer({ dest: 'uploads/' });

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Request Logging Middleware
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

// --- Routes ---

// Register
app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Missing fields' });

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await db.query('INSERT INTO users (username, password_hash) VALUES (?, ?)', [username, hashedPassword]);
        res.status(201).json({ message: 'User registered' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Username already exists' });
        }
        console.error('REGISTRATION ERROR:', err.message);
        res.status(500).json({ error: 'Database error: ' + err.message });
    }
});

// Login
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const [users] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
        if (users.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

        const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ token, user: { id: user.id, username: user.username } });
    } catch (err) {
        console.error('LOGIN ERROR:', err.message);
        res.status(500).json({ error: 'Database error: ' + err.message });
    }
});

// Middleware for protected routes
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// Calculate Endpoint
app.post('/api/calculate', (req, res) => {
    const { type, principal, rate, time, timeUnit, frequency, currency, rateUnit } = req.body;
    let P = parseFloat(principal);
    let R = parseFloat(rate);
    let T = parseFloat(time);
    let n = parseInt(frequency || 1);

    // Convert Interest in Rupees (Monthly %) to Annual %
    if (rateUnit === 'month') {
        R = R * 12;
    }

    if (timeUnit === 'months') T = T / 12;

    let interest = 0;
    let total = 0;
    let emi = 0;
    let chartData = [];
    let labels = [];

    if (type === 'simple') {
        interest = (P * R * T) / 100;
        total = P + interest;
        for (let i = 0; i <= Math.ceil(T); i++) {
            labels.push(`Year ${i}`);
            chartData.push(P + (P * R * i) / 100);
        }
    } else if (type === 'compound') {
        total = P * Math.pow((1 + (R / (100 * n))), (n * T));
        interest = total - P;
        for (let i = 0; i <= Math.ceil(T); i++) {
            labels.push(`Year ${i}`);
            chartData.push(P * Math.pow((1 + (R / (100 * n))), (n * i)));
        }
    } else if (type === 'emi') {
        const monthlyRate = R / (12 * 100);
        const months = T * 12; // T is in years here
        if (monthlyRate === 0) {
            emi = P / months;
        } else {
            emi = (P * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
        }
        total = emi * months;
        interest = total - P;

        let balance = P;
        labels.push('Start');
        chartData.push(P);
        const step = Math.max(1, Math.floor(months / 10));

        for (let i = 1; i <= months; i++) {
            const interestForMonth = balance * monthlyRate;
            const principalForMonth = emi - interestForMonth;
            balance -= principalForMonth;
            if (i % step === 0 || i === months) {
                labels.push(`Month ${i}`);
                chartData.push(Math.max(0, balance));
            }
        }
    }

    res.json({
        interest,
        total,
        emi,
        labels,
        chartData
    });
});

// Save History
app.post('/api/history', authenticateToken, async (req, res) => {
    const { type, principal, rate, time, result } = req.body;
    try {
        await db.query(
            'INSERT INTO history (user_id, type, principal, rate, time, result) VALUES (?, ?, ?, ?, ?, ?)',
            [req.user.id, type, principal, rate, time, JSON.stringify(result)]
        );
        res.status(201).json({ message: 'History saved' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to save history' });
    }
});

// Get History
app.get('/api/history', authenticateToken, async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM history WHERE user_id = ? ORDER BY created_at DESC', [req.user.id]);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// --- Borrower Routes ---

// Add Borrower
app.post('/api/borrowers', authenticateToken, upload.single('evidence'), async (req, res) => {
    const { name, village, age, amount, rate, rateUnit, givenAt } = req.body;
    const evidencePath = req.file ? `uploads/${req.file.filename}` : null;

    try {
        await db.query(
            'INSERT INTO borrowers (user_id, name, village, age, amount, rate, rate_unit, given_at, evidence_path) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [req.user.id, name, village, age, amount, rate, rateUnit, givenAt, evidencePath]
        );
        res.status(201).json({ message: 'Borrower added successfully' });
    } catch (err) {
        console.error('ADD BORROWER ERROR:', err.message);
        res.status(500).json({ error: 'Failed to add borrower: ' + err.message });
    }
});



// Get Borrowers
app.get('/api/borrowers', authenticateToken, async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM borrowers WHERE user_id = ? ORDER BY created_at DESC', [req.user.id]);
        res.json(rows);
    } catch (err) {
        console.error('GET BORROWERS ERROR:', err.message);
        res.status(500).json({ error: 'Database error: ' + err.message });
    }
});

// Start Server
app.listen(PORT, async () => {
    console.log(`Server running on http://localhost:${PORT}`);
    try {
        await db.query('SELECT 1');
        console.log('Database connected successfully on startup.');
    } catch (e) {
        console.error('DATABASE CONNECTION FAILED ON STARTUP:', e.message);
    }
});
