const { Pool } = require('pg');
require('dotenv').config();

// Print some info to see what's going on
console.log('--- PG CLEAR START ---');
console.log('DATABASE_URL length:', process.env.DATABASE_URL ? process.env.DATABASE_URL.length : 'MISSING');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function clear() {
    try {
        console.log('Attemping truncate...');
        const res = await pool.query('TRUNCATE borrowers, history RESTART IDENTITY CASCADE');
        console.log('SUCCESS:', res.command);
    } catch (e) {
        console.error('FAILED:', e.message);
    } finally {
        await pool.end();
        console.log('--- PG CLEAR END ---');
        process.exit(0);
    }
}

clear();
