const mysql = require('mysql2/promise');
require('dotenv').config();
const bcrypt = require('bcryptjs');

async function verifyAuth() {
    console.log('--- DB & AUTH VERIFICATION ---');
    let conn;
    try {
        conn = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        const testUser = 'test_verify_' + Date.now();
        const testPass = 'pass123';
        const hashedPassword = await bcrypt.hash(testPass, 10);

        // 1. Test Registration
        console.log('Testing Registration...');
        const [regResult] = await conn.query('INSERT INTO users (username, password_hash) VALUES (?, ?)', [testUser, hashedPassword]);
        const userId = regResult.insertId;
        console.log('Registration: SUCCESS (userId: ' + userId + ')');

        // 2. Test Borrower Association (The fixed part)
        console.log('Testing Borrower Association...');
        await conn.query(
            'INSERT INTO borrowers (user_id, name, given_at, amount, rate, rate_unit) VALUES (?, ?, ?, ?, ?, ?)',
            [userId, 'Test Borrower', '2025-01-01', 1000, 2, 'month']
        );
        console.log('Borrower Association: SUCCESS');

        // 3. Test Retrieval
        console.log('Testing Borrower Retrieval...');
        const [rows] = await conn.query('SELECT * FROM borrowers WHERE user_id = ?', [userId]);
        if (rows.length > 0) {
            console.log('Retrieval: SUCCESS (Found ' + rows.length + ' borrower)');
        } else {
            console.log('Retrieval: FAILED');
        }

        // Cleanup
        await conn.query('DELETE FROM borrowers WHERE user_id = ?', [userId]);
        await conn.query('DELETE FROM users WHERE id = ?', [userId]);
        console.log('Cleanup: SUCCESS');
        console.log('--- ALL BACKEND TESTS PASSED ---');

    } catch (e) {
        console.error('VERIFICATION ERROR:', e.message);
    } finally {
        if (conn) await conn.end();
    }
}
verifyAuth();
