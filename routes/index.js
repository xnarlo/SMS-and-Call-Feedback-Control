const express = require('express');
const router = express.Router();

// ...existing code...

router.get('/guide', (req, res) => {
    res.render('guide');
});

router.get('/about', (req, res) => {
    res.render('about');
});

router.get('/index', (req, res) => {
    res.render('index');
});

// ...existing code...

module.exports = router;