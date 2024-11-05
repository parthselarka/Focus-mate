    const express = require('express');
    const app = express();
    const pool = require('./db'); // Ensure this path correctly points to your db setup file
    const cors = require('cors');
    const moment = require('moment');
    const bodyParser = require('body-parser');
    const cron = require('node-cron');
    const session = require('express-session');

    // Assuming timer-settings.js is in a directory named "routes"
    const PushNotifications = require('@pusher/push-notifications-server');

    let beamsClient = new PushNotifications({
    instanceId: 'b4dc10ff-33bb-4d77-ae4d-ba8d0399da02',
    secretKey: 'CFF061D879BA64A3D5A65F5DE8DE1BDB3DF73289CE51F37E27DF87ECE63E4525'
    });

    app.use(express.static('public'));


    app.use(cors());

    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json());

    // Set EJS as templating engine
    app.set('view engine', 'ejs');

    app.use(session({
        secret: 'c0a912046a3e38e642273c57244e579c373826343c1e646251cd4de7d17f9d31b5f4592f4147bbf4eadf34c784dcf26417e29f34ff5f07a9aba07e2e8be26747', // Replace 'yourSecretKey' with your actual secret key
        resave: false,
        saveUninitialized: true,
        cookie: { secure: false,
            httpOnly: true, 
            maxAge: 3600000 }
    }));

    const userRoutes = require('./routes/users');

    const timerSettingsRoutes = require('./routes/timer-settings');
    app.use('/api/timer/settings', timerSettingsRoutes);
    // Use the routes
    app.use(userRoutes);

    const { checkTasksStartTimes } = require('./utils/checkTasksStartTimes');

    

    const nodemailer = require('nodemailer');

    // Configure your SMTP transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail', // Use your SMTP provider
      auth: {
        user: 'focus01mate@gmail.com',
        pass: 'bopu mxsy vmiz lqgl'
      }
    });
    
    async function getRelevantTasks() {
        const now = new Date();

        // Get the local timezone offset in milliseconds (it's returned in minutes, hence the multiplication)
        const timezoneOffset = now.getTimezoneOffset() * 60000;
    
        // Adjust 'now' to represent the local time by subtracting the timezone offset
        const localNow = new Date(now - timezoneOffset);
    
        // Calculate 15 minutes later from 'localNow'
        const fifteenMinutesLater = new Date(localNow.getTime() + 15 * 60000);

        const query = `
            SELECT s.*, u.email 
            FROM schedule s
            JOIN users u ON s.user_id = u.id
            WHERE s.start BETWEEN $1 AND $2
        `;
        try {
            const { rows } = await pool.query(query, [localNow, fifteenMinutesLater]);
            return rows; // Rows of tasks starting within the next 15 minutes, along with user email
        } catch (error) {
            console.error('Error fetching tasks:', error);
            return [];
        }
    }
    
    // Scheduled task to run every minute
    cron.schedule('* * * * *', async () => {
        const tasks = await getRelevantTasks();
        tasks.forEach(task => {
            // Check if the task has an associated email (assuming users have emails)
            if(task.user_email) {
                let mailOptions = {
                    from: 'focus01mate@gmail.com',
                    to: task.user_email, // Use the email associated with the task
                    subject: 'Task Reminder',
                    text: `Your task "${task.title}" is starting ${task.start_time <= new Date().toISOString() ? 'now' : 'soon'}.`
                };
                
                transporter.sendMail(mailOptions, function(error, info){
                    if (error) {
                        console.log(error);
                    } else {
                        console.log('Email sent: ' + info.response);
                    }
                });
            }
        });
    });
    




    // Middleware to parse JSON and URL-encoded request bodies
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Serve static files from 'public' directory
    app.use(express.static('public'));

    // Import routes
    const taskRoutes = require('./routes/tasks'); // Ensure this path correctly points to your tasks route file

    // Use routes
    app.use('/api/tasks', taskRoutes);

    // Define additional routes
    app.get('/', (req, res) => {
        res.render('home', { userId: req.session.userId });
    });

    app.get('/login', (req, res) => {
        res.render('login');
    });

    // Route to render the signup page
    app.get('/signup', (req, res) => {
        res.render('signup');
    });
    app.get('/forgot-password', (req, res) => {
        res.render('forgot-password');
    });

    app.get('/schedule', (req, res) => {
        res.render('schedule', { userId: req.session.userId });
    });

    app.get('/timer', (req, res) => {
        res.render('timer',{ userId: req.session.userId });
    });

    // Handle 404 - Page Not Found
    app.use((req, res) => {
        res.status(404).send('Page not found');
    });


    // Start the server
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
