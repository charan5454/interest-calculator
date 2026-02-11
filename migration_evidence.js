const mysql = require('mysql2/promise');
require('dotenv').config();

async function addEvidenceColumn() {
    console.log('--- ADDING EVIDENCE COLUMN ---');
    try {
        const conn = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        const [columns] = await conn.query('SHOW COLUMNS FROM borrowers');
        if (!columns.some(c => c.Field === 'evidence_path')) {
            await conn.query('ALTER TABLE borrowers ADD COLUMN evidence_path VARCHAR(255) AFTER given_at');
            console.log('Column evidence_path added.');
        } else {
            console.log('Column evidence_path already exists.');
        }

        await conn.end();
    } catch (e) {
        console.error('ERROR:', e.message);
    }
}
addEvidenceColumn();
