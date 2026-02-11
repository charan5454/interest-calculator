require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : null
});

// Test connection
pool.getConnection()
    .then(conn => {
        console.log('Database connected successfully');
        conn.release();
    })
    .catch(err => {
        console.error('Database connection failed:', err.message);
        console.error('Check Render Environment Variables.');
    });

module.exports = pool;
