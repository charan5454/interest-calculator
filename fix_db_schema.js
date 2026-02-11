const mysql = require('mysql2/promise');
require('dotenv').config();

async function fix() {
    let conn;
    try {
        conn = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });
        console.log('Connected to DB');

        // Check columns in borrowers
        const [columns] = await conn.query('SHOW COLUMNS FROM borrowers');
        const hasUserId = columns.some(c => c.Field === 'user_id');

        if (!hasUserId) {
            console.log('Adding user_id to borrowers...');
            await conn.query('ALTER TABLE borrowers ADD COLUMN user_id INT AFTER id');
            await conn.query('ALTER TABLE borrowers ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE');
            console.log('Added user_id.');
        } else {
            console.log('user_id column exists.');
        }

        await conn.end();
        console.log('FIX DONE');
    } catch (e) {
        console.error('ERROR:', e.message);
    }
}
fix();
