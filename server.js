const express = require("express");
const path = require("path");
const session = require("express-session");
const bodyParser = require("body-parser");
const db = require("./config/db");
const authRoutes = require("./routes/authRoute");

require("dotenv").config();

const app = express();
const port = 3000;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views")); // ✅ Ensure Express uses `/views`

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// ✅ Session Middleware
app.use(
    session({
        secret: "your_secret_key",
        resave: false,
        saveUninitialized: false,
        cookie: { secure: false }, // Change to true in production with HTTPS
    })
);

// ✅ Middleware to make `user` available in all views
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});

// ✅ Middleware to enforce authentication
app.use((req, res, next) => {
    if (!req.session.user && req.path !== "/login" && req.path !== "/logout") {
        return res.redirect("/login");
    }
    next();
});

// ✅ Apply Authentication Routes
app.use("/", authRoutes);

// ✅ Home Route
app.get("/", (req, res) => {
    res.render("index");
});

// ✅ About Route
app.get("/about", (req, res) => {
    res.render("about");
});


// ✅ Guide Route
app.get("/guide", (req, res) => {
    res.render("guide");
});

// ✅ Start Server
app.listen(port, () => console.log(`🚀 Server running on port ${port}`));
