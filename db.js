const { Pool } = require('pg');
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'tasks',
    password: '124816',
    port: 5433,
});

module.exports = pool;
