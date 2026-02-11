const mysql = require('mysql2/promise');
require('dotenv').config();

async function fix() {
    console.log('--- REPAIRING DATABASE SCHEMA ---');
    let conn;
    try {
        conn = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD
        });

        await conn.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`);
        await conn.changeUser({ database: process.env.DB_NAME });
        console.log('Connected to DB:', process.env.DB_NAME);

        // Ensure users table exists
        await conn.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(255) NOT NULL UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Users table checked.');

        // Ensure borrowers table exists with correct schema
        await conn.query(`
            CREATE TABLE IF NOT EXISTS borrowers (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                name VARCHAR(255) NOT NULL,
                village VARCHAR(255),
                age INT,
                amount DECIMAL(15, 2) NOT NULL,
                rate DECIMAL(15, 2) NOT NULL,
                rate_unit VARCHAR(10) DEFAULT 'year',
                given_at DATE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        console.log('Borrowers table checked.');

        // Double check user_id column in borrowers (in case it was created without it)
        const [columns] = await conn.query('SHOW COLUMNS FROM borrowers');
        const hasUserId = columns.some(c => c.Field === 'user_id');
        if (!hasUserId) {
            console.log('Repairing missing user_id column...');
            await conn.query('ALTER TABLE borrowers ADD COLUMN user_id INT AFTER id');
            await conn.query('ALTER TABLE borrowers ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE');
            console.log('user_id added.');
        }

        console.log('--- SCHEMA REPAIR COMPLETE ---');
    } catch (e) {
        console.error('SCHEMA REPAIR ERROR:', e.message);
    } finally {
        if (conn) await conn.end();
    }
}
fix();
