const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Basic .env parser
function parseEnv() {
    const envPath = path.join(__dirname, '.env');
    if (!fs.existsSync(envPath)) return {};
    const content = fs.readFileSync(envPath, 'utf8');
    const env = {};
    content.split('\n').forEach(line => {
        const [key, ...value] = line.split('=');
        if (key && value) {
            env[key.trim()] = value.join('=').trim();
        }
    });
    return env;
}

const env = parseEnv();
console.log('--- FINAL CLEAR ATTEMPT ---');
console.log('DB_NAME:', env.DB_NAME);

const pool = new Pool({
    user: env.DB_USER || 'root',
    host: env.DB_HOST || 'localhost',
    database: env.DB_NAME || 'interest_calculator',
    password: env.DB_PASSWORD || '',
    port: 5432,
});

async function clear() {
    try {
        console.log('Connecting...');
        const res = await pool.query('TRUNCATE borrowers, history RESTART IDENTITY CASCADE');
        console.log('SUCCESS:', res.command);
    } catch (e) {
        console.error('FAILED:', e.message);
    } finally {
        await pool.end();
        console.log('--- DONE ---');
        process.exit(0);
    }
}

clear();
