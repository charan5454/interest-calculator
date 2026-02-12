const { Pool } = require('pg');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function clearPG() {
    console.log('--- Attempting PostgreSQL Clear ---');
    try {
        const pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        });
        await pool.query('TRUNCATE borrowers, history RESTART IDENTITY CASCADE');
        console.log('PostgreSQL: SUCCESS');
        await pool.end();
    } catch (e) {
        console.error('PostgreSQL Clear Failed:', e.message);
    }
}

async function clearMySQL() {
    console.log('--- Attempting MySQL Clear ---');
    try {
        const conn = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'interest_calculator'
        });
        await conn.query('DELETE FROM borrowers');
        await conn.query('DELETE FROM history');
        console.log('MySQL: SUCCESS');
        await conn.end();
    } catch (e) {
        console.error('MySQL Clear Failed:', e.message);
    }
}

async function run() {
    await clearPG();
    await clearMySQL();
    process.exit(0);
}

run();
