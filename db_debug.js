require('dotenv').config();
const mysql = require('mysql2/promise');

async function debugDb() {
    try {
        console.log('Connecting to database...');
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });
        console.log('SUCCESS: Connected to database.');

        const [tables] = await connection.query('SHOW TABLES');
        console.log('Tables found:', tables.map(t => Object.values(t)[0]));

        const hasBorrowers = tables.some(t => Object.values(t)[0] === 'borrowers');
        if (!hasBorrowers) {
            console.error('ERROR: "borrowers" table is missing!');
        } else {
            const [desc] = await connection.query('DESCRIBE borrowers');
            console.log('Structure of "borrowers" table:');
            console.table(desc);
        }

        await connection.end();
    } catch (err) {
        console.error('DATABASE ERROR:', err.message);
        if (err.code === 'ECONNREFUSED') {
            console.error('Double check if MySQL service is running.');
        }
    }
}

debugDb();
