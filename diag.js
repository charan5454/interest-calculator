require('dotenv').config();
const mysql = require('mysql2/promise');

async function check() {
    try {
        console.log('Attempting to connect to:', process.env.DB_HOST);
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });
        console.log('Connected!');
        await connection.end();
    } catch (e) {
        console.error('Error:', e.message);
    }
}
check();
