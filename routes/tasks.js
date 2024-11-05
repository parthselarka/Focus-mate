const express = require('express');
const router = express.Router();
const pool = require('../db');

// Middleware to ensure the user is authenticated
const ensureAuthenticated = (req, res, next) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Please log in to access this resource.' });
    }
    next();
};

// Fetch all tasks for a specific user
router.get('/', ensureAuthenticated, async (req, res) => {
    const userId = req.session.userId;
    try {
        const userTasks = await pool.query('SELECT * FROM schedule WHERE user_id = $1', [userId]);
        res.json(userTasks.rows.map(task => ({
            ...task,
            start:task.start,
            userId: task.user_id,
            title:task.title,
            id:task.task_id,
            allDay: task.all_day,
            end:task.end_event
        })));
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// Add a new task
router.post('/', ensureAuthenticated, async (req, res) => {
    const { title, start, end, allDay } = req.body;
    const userId = req.session.userId;

    try {
        const newTask = await pool.query(
            'INSERT INTO schedule (title, start, end_event, all_day, user_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [title, start, end, allDay, userId]
        );
        res.json(newTask.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// Delete a task
router.delete('/:taskId', ensureAuthenticated, async (req, res) => {
    const taskId = parseInt(req.params.taskId);
    const userId = req.session.userId;

    try {
        const deleteOperation = await pool.query(
            'DELETE FROM schedule WHERE task_id = $1 AND user_id = $2 RETURNING *',
            [taskId, userId]
        );

        if (deleteOperation.rows.length > 0) {
            res.json({ message: 'Task deleted successfully.' });
        } else {
            res.status(404).json({ message: 'Task not found or not authorized to delete.' });
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// Update a task
router.put('/:taskId', ensureAuthenticated, async (req, res) => {
    const { taskId } = req.params; // taskId from URL
    const userId = req.session.userId; // userId from session
    const { title, allDay, start, end } = req.body; // Data to update

    try {
        // First, ensure the task belongs to the user
        const taskQueryResult = await pool.query('SELECT * FROM schedule WHERE task_id = $1 AND user_id = $2', [taskId, userId]);

        if (taskQueryResult.rows.length === 0) {
            // No task found for this user with the given taskId
            return res.status(404).json({ message: 'Task not found or not authorized to modify this task' });
        }

        // Perform the update if the task belongs to the user
        const updatedTask = await pool.query(
            'UPDATE schedule SET title = $1, all_day = $2, start = $3, end_event = $4 WHERE task_id = $5 AND user_id = $6 RETURNING *',
            [title, allDay, start, end, taskId, userId]
        );

        if (updatedTask.rows.length) {
            res.json(updatedTask.rows[0]);
        } else {
            res.status(404).json({ message: "Task not found or no changes made." });
        }
    } catch (error) {
        console.error("Error updating task:", error);
        res.status(500).json({ message: "Error updating task" });
    }
});

// In your tasks route file (e.g., routes/tasks.js)
router.get('/today', ensureAuthenticated, async (req, res) => {
    const userId = req.session.userId;
    const today = new Date().toISOString().slice(0, 10); // Format as 'YYYY-MM-DD'
    
    try {
        const todayTasks = await pool.query(`
            SELECT * FROM schedule 
            WHERE user_id = $1 AND DATE(start) = $2`,
            [userId, today]
        );
        res.json(todayTasks.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// Assuming 'router' is an instance of express.Router() and you've set up middleware and database connections appropriately

// Update a task's completed status
// PUT endpoint to update task completion status
router.put('/:taskId/complete', async (req, res) => {
    const { taskId } = req.params;
    const { completed } = req.body; // Assuming you send a boolean value indicating the completion status
    const userId = req.session.userId; // Assuming user authentication is in place

    try {
        const result = await pool.query(
            "UPDATE schedule SET completed = $1 WHERE task_id = $2 AND user_id = $3 RETURNING *",
            [completed, taskId, userId]
        );

        if(result.rows.length > 0) {
            res.json({ message: "Task updated successfully", task: result.rows[0] });
        } else {
            res.status(404).json({ message: "Task not found or user not authorized" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});



module.exports = router;
