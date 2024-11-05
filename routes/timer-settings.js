const express = require('express');
const router = express.Router();
const pool = require('../db'); // Adjust the path as needed to point to your database configuration
const ensureAuthenticated = require('../middleware/ensureAuthenticated'); // Assuming you have middleware to check authentication

// Fetch timer settings for the authenticated user
router.get('/', ensureAuthenticated, async (req, res) => {
    const userId = req.session.userId;

    try {
        const settings = await pool.query(
            "SELECT work_duration, break_duration FROM timer_settings WHERE user_id = $1",
            [userId]
        );

        if (settings.rows.length > 0) {
            res.json(settings.rows[0]);
        } else {
            // Default settings if not set by the user
            res.json({ work_duration: 25, break_duration: 5 });
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// Update timer settings for the authenticated user
router.post('/', ensureAuthenticated, async (req, res) => {
    const userId = req.session.userId;
    const { work_duration, break_duration } = req.body;

    try {
        const update = await pool.query(
            `INSERT INTO timer_settings (user_id, work_duration, break_duration)
            VALUES ($1, $2, $3)
            ON CONFLICT (user_id) DO UPDATE
            SET work_duration = EXCLUDED.work_duration, break_duration = EXCLUDED.break_duration
            RETURNING *;
            `,
            [userId, work_duration, break_duration]
        );

        res.json(update.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

function fetchTodaysTasks() {
    const now = new Date();

    // Get the local timezone offset in milliseconds (it's returned in minutes, hence the multiplication)
    const timezoneOffset = now.getTimezoneOffset() * 60000;

    // Adjust 'now' to represent the local time by subtracting the timezone offset
    const localNow = new Date(now - timezoneOffset);

    // Format 'localNow' to YYYY-MM-DD format
    const today = localNow.toISOString().slice(0, 10);

    fetch(`/api/tasks/today?date=${today}`, {
        credentials: 'include'
    })
    .then(response => response.json())
    .then(tasks => {
        // Assuming 'displayTasks' is a function that takes tasks array and displays them
        displayTasks(tasks);
    })
    .catch(error => console.error('Error:', error));
}


module.exports = router;
