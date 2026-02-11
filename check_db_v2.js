require('dotenv').config();
const mysql = require('mysql2/promise');

async function check() {
    let conn;
    try {
        conn = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });
        console.log('Connected to DB');

        const [rows] = await conn.query('DESC borrowers');
        console.log('Borrowers Table Structure:');
        rows.forEach(row => console.log(row.Field, row.Type, row.Null, row.Key));

        const [users] = await conn.query('SELECT id, username FROM users');
        console.log('Users found:', users.length);

    } catch (e) {
        console.error('Check failed:', e.message);
    } finally {
        if (conn) await conn.end();
    }
}
check();
