const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER || 'postgres', // Default to 'postgres' if not set
    host: process.env.DB_HOST || 'localhost', // Default to 'localhost'
    database: process.env.DB_NAME || 'tasks', // Default to 'tasks'
    password: process.env.DB_PASSWORD || '124816', // Default to '124816'
    port: process.env.DB_PORT || 5433, // Default to 5433
    connectionString: process.env.DATABASE_URL, // Use the DATABASE_URL from .env
    ssl: {
        rejectUnauthorized: false, // If needed, for production
    },
});

module.exports = pool;