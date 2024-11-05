const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
// Assuming you have a db.js file that exports a configured pool object
const pool = require('../db');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const session = require('express-session');


function generateSecureToken() {
    return crypto.randomBytes(20).toString('hex');
}

// Inside your forgot password route or wherever you need to generate the token
const resetToken = generateSecureToken();


router.get('/signup', (req, res) => {
    // Check if there's an error message in the query parameters
    const errorMessage = req.query.error || '';

    // Render the signup page with an optional error message
    // Ensuring that an 'error' variable is always passed to the template
    res.render('signup', { error: errorMessage });
});

router.post('/signup', async (req, res) => {
    let { email, password, username, confirmPassword } = req.body;
    email = email.toLowerCase();
    // Basic validation to ensure data exists
    if (!email || !password || !username) {
        return res.redirect('/signup?error=Email, username, and password are required');
    }
    if (password.length < 8) {
        // Handle error: Redirect back or send an error message
        return res.redirect('/signup?error=Password must be at least 8 characters long');
    }
    if (password !== confirmPassword) {
        // Redirect back to the signup page with an error message
        return res.redirect('/signup?error=Passwords do not match');
    }
    const saltRounds = 10;

    try {
        // Hash the password
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Insert the new user into the database, including username
        const result = await pool.query('INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email', [username, email, hashedPassword]);

        // Redirect to login page or a success page
        res.redirect('/login?success=Account created successfully');
    } catch (error) {
        if (error.code === '23505') {
            // Redirect back to the signup page with an error message
            res.redirect('/signup?error=Email already in use');
        } else {
            console.error(error);
            // Redirect back to the signup page with a generic error message
            res.redirect('/signup?error=Internal server error');
        }
    }
});


router.get('/login', (req, res) => {
    // Check if there's an error message in the query parameters
    const errorMessage = req.query.error;

    // Render the login page with an optional error message
    res.render('login', { error: errorMessage });
});

router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Check if user exists by username
        const userQueryResult = await pool.query('SELECT * FROM users WHERE username = $1', [username.toLowerCase()]);
        if (userQueryResult.rows.length > 0) {
            const user = userQueryResult.rows[0];

            // Compare provided password with stored hash
            const match = await bcrypt.compare(password, user.password_hash);
            if (match) {
                // Setting user ID to session
                req.session.userId = user.id;
                console.log(req.session); // Check if userId is set
                // Redirect to home or dashboard page
                res.redirect('/'); // Adjust the redirect path as needed
            } else {
                // Redirect back to the login page with a generic error message
                res.redirect('/login?error=Invalid username or password');
            }
        } else {
            // Redirect back to the login page with a generic error message
            res.redirect('/login?error=Invalid username or password');
        }
    } catch (error) {
        console.error(error);
        // Redirect back to the login page with a generic error message
        res.redirect('/login?error=Internal server error');
    }
});



router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

    // Basic validation
    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    try {
        const userQueryResult = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
        if (userQueryResult.rows.length === 0) {
            // It's often a good idea to avoid confirming whether an email is registered
            return res.status(200).json({ message: "If an account with that email exists, a password reset email has been sent." });
        }

        const user = userQueryResult.rows[0];
        const token = generateSecureToken(); // Implement this function to generate a secure token
        const expiry = new Date(Date.now() + 3600000); // 1 hour from now

        // Save the token and its expiry to the database (add columns for these if not already present)
        await pool.query('UPDATE users SET reset_token = $1, token_expiry = $2 WHERE email = $3', [token, expiry, email.toLowerCase()]);

        // Send the email
        const resetLink = `http://localhost:3000/reset-password?token=${token}`;
        await sendPasswordResetEmail(email, resetLink); // Adjust to use your email sending function

        es.redirect('/login');
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

async function sendPasswordResetEmail(email, link) {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'focus01mate@gmail.com', // Replace with your Gmail address
            pass: 'bopu mxsy vmiz lqgl'
        }
    });

    const mailOptions = {
        from: 'focus01mate@gmail.com',
        to: email,
        subject: 'Password Reset',
        html: `<p>You requested a password reset.</p><p>Click this <a href="${link}">link</a> to set a new password.</p>`
    };

    await transporter.sendMail(mailOptions);
}

router.get('/reset-password', (req, res) => {
    const { token } = req.query; // Extract the token from query parameters
    if (!token) {
        return res.status(400).send("Token is required");
    }
    // Render the reset password page and pass the token to it
    res.render('reset-password', { token });
});


router.post('/reset-password', async (req, res) => {
    const { token, password } = req.body;
    if (!token || !password) {
        return res.status(400).json({ error: 'Token and new password are required' });
    }

    try {
        // Verify token validity and expiration
        const userQueryResult = await pool.query('SELECT * FROM users WHERE reset_token = $1 AND token_expiry > NOW()', [token]);
        if (userQueryResult.rows.length === 0) {
            return res.status(400).json({ error: 'Invalid or expired token' });
        }

        const user = userQueryResult.rows[0];
        const hashedPassword = await bcrypt.hash(password, 10);

        // Update user's password
        await pool.query('UPDATE users SET password_hash = $1, reset_token = NULL, token_expiry = NULL WHERE id = $2', [hashedPassword, user.id]);

        res.send('Password has been reset successfully. You can now login with your new password.');
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error(err);
        return res.redirect('/');
      }
      res.clearCookie('connect.sid'); // Adjust this if your session cookie has a different name
      res.redirect('/login');
    });
  });
  


  router.get('/timer', (req, res) => {
    if (req.session.userId) {
        // User is logged in
        res.render('timer', { userId: req.session.userId });
    } else {
        // User is not logged in
        res.redirect('/login');
    }
});

router.get('/schedule', (req, res) => {
    if (req.session.userId) {
        // User is logged in
        res.render('schedule', { userId: req.session.userId });
    } else {
        // User is not logged in
        res.redirect('/login');
    }
});



module.exports = router;