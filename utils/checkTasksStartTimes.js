const { Pool } = require('pg');
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'tasks',
    password: '124816',
    port: 5433,
}); // Configure with your database credentials

async function checkTasksStartTimes() {
    // Get the current time
    const now = new Date();

    // Get the local timezone offset in milliseconds (it's returned in minutes, hence the multiplication)
    const timezoneOffset = now.getTimezoneOffset() * 60000;

    // Adjust 'now' to represent the local time by subtracting the timezone offset
    const localNow = new Date(now - timezoneOffset);

    // Calculate 15 minutes later from 'localNow'
    const fifteenMinutesLater = new Date(localNow.getTime() + 15 * 60000);

    // Define the SQL query
    const query = `
        SELECT * FROM tasks
        WHERE start_time BETWEEN $1 AND $2
    `;
    // Convert 'localNow' and 'fifteenMinutesLater' back to ISO string for the database query
    const values = [localNow.toISOString(), fifteenMinutesLater.toISOString()];

    // Execute the query with the defined values
    try {
        const { rows } = await pool.query(query, values);
        return rows; // Rows of tasks starting within the next 15 minutes
    } catch (error) {
        console.error('Error fetching tasks:', error);
        throw error; // Rethrow or handle the error as appropriate
    }
}



module.exports = { checkTasksStartTimes };
