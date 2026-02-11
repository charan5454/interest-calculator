require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkTables() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });
        console.log('Connection successful.');

        const [tables] = await connection.query('SHOW TABLES');
        console.log('Tables in database:', tables.map(t => Object.values(t)[0]));

        try {
            const [users] = await connection.query('SELECT count(*) as count FROM users');
            console.log('Users count:', users[0].count);
        } catch (e) {
            console.log('Users table error:', e.message);
        }

        try {
            const [borrowers] = await connection.query('SELECT count(*) as count FROM borrowers');
            console.log('Borrowers count:', borrowers[0].count);
        } catch (e) {
            console.log('Borrowers table error:', e.message);
        }

        await connection.end();
    } catch (e) {
        console.error('Fatal Error:', e.message);
    }
}
checkTables();
