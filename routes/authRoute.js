const express = require("express");
const router = express.Router();
const db = require("../config/db");

// ✅ Login Route (Render Login Page)
router.get("/login", (req, res) => {
    res.render("login", { error: null });
});

// ✅ Handle Login Request
router.post("/login", (req, res) => {
    const { username, password } = req.body;

    const query = "SELECT full_name FROM user_accounts WHERE username = ? AND password = ?";
    db.query(query, [username, password], (err, results) => {
        if (err) {
            console.error("❌ Database error:", err);
            return res.status(500).send("Internal Server Error");
        }

        if (results.length > 0) {
            req.session.user = results[0].full_name; // ✅ Store full name in session
            res.redirect("/");
        } else {
            res.render("login", { error: "Invalid username or password" });
        }
    });
});

// ✅ Logout Route
router.get("/logout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/login");
    });
});

module.exports = router;
