const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/login', (req, res) => {
    res.render('login');
});

router.post('/login', (req, res) => {
    const { username, password } = req.body;

    const query = 'SELECT * FROM user_accounts WHERE username = ? AND password = ?';
    db.query(query, [username, password], (err, results) => {
        if (err) {
            console.error('Error querying the database:', err);
            res.status(500).json({ success: false, message: 'Internal server error' });
        } else if (results.length > 0) {
            res.json({ success: true, message: 'Login successful', redirect: '/index' });
        } else {
            res.json({ success: false, message: 'Invalid username or password', redirect: '/login' });
        }
    });
});

module.exports = router;
