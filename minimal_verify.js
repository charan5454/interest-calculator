const mysql = require('mysql2/promise');
require('dotenv').config();

async function minimalVerify() {
    console.log('--- MINIMAL DB VERIFY ---');
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'interest_calculator'
        });
        console.log('1. Connection: OK');

        const [tables] = await connection.query('SHOW TABLES');
        console.log('2. Tables found: ' + tables.length);

        const [borrowerCols] = await connection.query('SHOW COLUMNS FROM borrowers');
        const hasUserId = borrowerCols.some(c => c.Field === 'user_id');
        console.log('3. user_id in borrowers: ' + (hasUserId ? 'YES' : 'NO'));

        if (!hasUserId) {
            console.log('   ALERT: user_id column is missing!');
        }

        await connection.end();
        console.log('--- VERIFY COMPLETE ---');
    } catch (e) {
        console.log('VERIFY ERROR: ' + e.message);
        if (e.stack) console.log(e.stack);
    }
}
minimalVerify();
