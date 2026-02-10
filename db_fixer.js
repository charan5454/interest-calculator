require('dotenv').config();
const mysql = require('mysql2/promise');

async function fix() {
    console.log('--- Database Fixer ---');
    console.log('Params:', {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        database: process.env.DB_NAME
    });

    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD
        });
        console.log('1. Connected to MySQL Server.');

        await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`);
        console.log(`2. Database '${process.env.DB_NAME}' verified.`);

        await connection.changeUser({ database: process.env.DB_NAME });

        const sql = `
            CREATE TABLE IF NOT EXISTS borrowers (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                name VARCHAR(255) NOT NULL,
                village VARCHAR(255),
                age INT,
                amount DECIMAL(15, 2) NOT NULL,
                rate DECIMAL(5, 2) NOT NULL,
                rate_unit VARCHAR(10) DEFAULT 'year',
                given_at DATE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `;
        await connection.query(sql);
        console.log('3. "borrowers" table verified/created.');

        // Also ensure users and history exist just in case
        await connection.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(255) NOT NULL UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('4. "users" table verified.');

        await connection.end();
        console.log('--- Fix Completed Successfully ---');
    } catch (err) {
        console.error('--- FIX FAILED ---');
        console.error('Error Code:', err.code);
        console.error('Error Message:', err.message);
        if (err.code === 'ECONNREFUSED') {
            console.error('REASON: MySQL is NOT running. Please start MySQL from XAMPP/WAMP.');
        }
    }
}

fix();
