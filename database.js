require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// Test connection and initialize tables
const initDb = async () => {
    try {
        const client = await pool.connect();
        console.log('PostgreSQL connected successfully');

        // Auto Table Creation
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(255) UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS history (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                type VARCHAR(50),
                principal NUMERIC,
                rate NUMERIC,
                time NUMERIC,
                result JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS borrowers (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                name VARCHAR(255),
                village VARCHAR(255),
                age INTEGER,
                amount NUMERIC,
                rate NUMERIC,
                rate_unit VARCHAR(20),
                given_at DATE,
                evidence_path TEXT,
                is_repaid BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('PostgreSQL tables initialized');
        client.release();
    } catch (err) {
        console.error('Database initialization failed:', err.message);
    }
};

initDb();

module.exports = pool;
