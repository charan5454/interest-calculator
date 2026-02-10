const mysql = require('mysql2/promise');

async function check() {
    try {
        console.log('--- DIRECT DB CHECK ---');
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'interest_calculator'
        });
        console.log('Connection: SUCCESS');

        const [tables] = await connection.query('SHOW TABLES');
        console.log('Tables:', tables.map(t => Object.values(t)[0]).join(', '));

        const [users] = await connection.query('DESC users');
        console.log('Users columns:', users.map(c => c.Field).join(', '));

        await connection.end();
    } catch (e) {
        console.log('ERROR:', e.message);
    }
}
check();
