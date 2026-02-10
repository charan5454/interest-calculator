const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixRamesh() {
    try {
        const conn = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        // Correcting Ramesh's date from Jun 11 (2025-06-11) to Nov 6 (2025-11-06)
        console.log('Fixing Ramesh...');
        const [result] = await conn.query(
            "UPDATE borrowers SET given_at = '2025-11-06' WHERE name = 'ramesh' AND given_at = '2025-06-11'"
        );

        if (result.affectedRows > 0) {
            console.log('Successfully updated Ramesh\'s date to Nov 6, 2025.');
        } else {
            // Check if it's already fixed or stored slightly differently (e.g. 2025-06-10 in UTC)
            const [result2] = await conn.query(
                "UPDATE borrowers SET given_at = '2025-11-06' WHERE name = 'ramesh' AND (DATE(given_at) = '2025-06-11' OR DATE(given_at) = '2025-06-10')"
            );
            if (result2.affectedRows > 0) {
                console.log('Successfully updated Ramesh\'s date (handled UTC shift).');
            } else {
                console.log('Ramesh not found or already updated.');
            }
        }

        await conn.end();
    } catch (e) {
        console.error('ERROR:', e.message);
    }
}
fixRamesh();
