require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');

const logFile = 'setup_log.txt';
if (fs.existsSync(logFile)) fs.unlinkSync(logFile);

function log(msg) {
  console.log(msg);
  fs.appendFileSync(logFile, msg + '\n');
}
function logErr(msg, err) {
  console.error(msg, err);
  fs.appendFileSync(logFile, msg + ' ' + JSON.stringify(err, Object.getOwnPropertyNames(err)) + '\n');
}

async function setupDatabase() {
  log('Starting setup...');
  let connection;
  try {
    log('Connection params: ' + JSON.stringify({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      database: process.env.DB_NAME
    }));
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD
    });

    log('Connected to server.');
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`);
    log(`Database '${process.env.DB_NAME}' created or checks out.`);

    await connection.changeUser({ database: process.env.DB_NAME });
    log('Changed to target database.');

    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    await connection.query(createUsersTable);
    log('Users table ready.');

    const createHistoryTable = `
      CREATE TABLE IF NOT EXISTS history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        type VARCHAR(50) NOT NULL,
        principal DECIMAL(15, 2) NOT NULL,
        rate DECIMAL(5, 2) NOT NULL,
        time DECIMAL(5, 2) NOT NULL,
        result JSON NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `;
    await connection.query(createHistoryTable);
    log('History table ready.');

    const createBorrowersTable = `
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
        `;
    await connection.query(createBorrowersTable);
    log('Borrowers table ready.');

  } catch (err) {
    logErr('Error setting up database:', err);
  } finally {
    if (connection) await connection.end();
    log('Setup finished.');
  }
}

setupDatabase();
