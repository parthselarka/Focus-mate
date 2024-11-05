const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL, // Use the DATABASE_URL from .env
    ssl: {
        rejectUnauthorized: false, // If needed, for production
    },
});

module.exports = pool;
