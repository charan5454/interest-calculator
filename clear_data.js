const pool = require('./database');

const clearData = async () => {
    try {
        console.log('--- DATA CLEAR SCRIPT STARTED ---');
        console.log('Connecting to database...');

        // Wait for pool to initialize
        await new Promise(resolve => setTimeout(resolve, 1000));

        console.log('Executing TRUNCATE on borrowers and history...');
        const result = await pool.query('TRUNCATE borrowers, history RESTART IDENTITY CASCADE');
        console.log('TRUNCATE result:', result.command);
        console.log('Successfully cleared all records.');
        process.exit(0);
    } catch (err) {
        console.error('ERROR CLEARING DATA:');
        console.error(err.stack || err.message);
        process.exit(1);
    }
};

clearData();
