require('dotenv').config();
const mysql = require('mysql2/promise');

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

        console.log('Altering table borrowers...');
        await conn.query('ALTER TABLE borrowers MODIFY Column rate DECIMAL(15, 2) NOT NULL');
        console.log('Table altered successfully.');

    } catch (e) {
        console.error('Fix failed:', e.message);
        // If table doesn't exist, setup_database.js will handle it.
    } finally {
        if (conn) await conn.end();
    }
}
fix();
