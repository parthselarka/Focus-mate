const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: 'tasks_ks22_user',       // Replace with the user provided by Render
    host: 'dpg-cskt6uqj1k6c73bn58og-a',       // Replace with the host provided by Render
    database: 'tasks_ks22',     // Replace with the database name provided by Render
    password: 'BwuB1XiPalgt0j26dQVJcylAIlQI3By5', // Replace with the password provided by Render
    port: 5432, 
    ssl: {
        rejectUnauthorized: false, // If needed, for production
    },
});

module.exports = pool;