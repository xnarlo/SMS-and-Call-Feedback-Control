const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const bodyParser = require("body-parser");
const { serialPort, parser } = require("./serial"); // Import serial communication

require("dotenv").config();

const app = express();
const server = http.createServer(app);
const io = new Server(server); // Initialize Socket.io
const port = 3000;

// Set up EJS for rendering views
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// Serial event listeners
serialPort.on("open", () => console.log("✅ Serial Port Opened"));
serialPort.on("error", (err) => console.error("❌ Serial Port Error:", err.message));

parser.on("data", (data) => {
    const trimmedData = data.trim();
    console.log("📩 Received from Arduino:", trimmedData);
    
    if (trimmedData === "SMS_SENT" || trimmedData === "SMS_FAILED") {
        io.emit("sms_status", trimmedData); // Notify clients
    } else if (trimmedData === "CALL_STARTED" || trimmedData === "CALL_ENDED") {
        io.emit("call_status", trimmedData); // Notify clients
    }
});

// Routes
app.get("/sendsms", (req, res) => res.render("sendsms"));
app.get("/callclient", (req, res) => res.render("callclient"));

app.post("/send", (req, res) => {
    const { number, message } = req.body;
    const command = `SEND_SMS,${number},${message}\n`;
    serialPort.write(command);
    res.send("SMS command sent");
});

app.post("/call", (req, res) => {
    const { number } = req.body;
    const command = `MAKE_CALL,${number}\n`;
    serialPort.write(command);
    res.send("Call command sent");
});

app.post("/endcall", (req, res) => {
    const command = `END_CALL\n`;
    serialPort.write(command);
    res.send("End Call command sent");
});

server.listen(port, () => console.log(`🚀 Server running on port ${port}`));
