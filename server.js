const express = require("express");
const bodyParser = require("body-parser");
const { SerialPort } = require("serialport");
const { ReadlineParser } = require("@serialport/parser-readline");
require("dotenv").config();

const app = express();
const port = 3000;

// Set up EJS for rendering views
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// Dynamic COM port configuration
const portPath = process.env.SERIAL_PORT || "COM3";
const serialPort = new SerialPort({ path: portPath, baudRate: 115200 });
const parser = serialPort.pipe(new ReadlineParser());

// Serial event listeners
serialPort.on("open", () => console.log("✅ Serial Port Opened"));
serialPort.on("error", (err) => console.error("❌ Serial Port Error:", err.message));
parser.on("data", (data) => console.log("📩 Received from Arduino:", data.trim()));

// Routes
app.get("/sendsms", (req, res) => res.render("sendsms"));
app.get("/callclient", (req, res) => res.render("callclient"));

app.post("/send", (req, res) => {
    const { number, message } = req.body;
    const command = `SEND_SMS,${number},${message}\n`;
    serialPort.write(command);
    res.send("SMS Sent");
});

app.post("/call", (req, res) => {
    const { number } = req.body;
    const command = `MAKE_CALL,${number}\n`;
    serialPort.write(command);
    res.send("Call Initiated");
});

app.post("/endcall", (req, res) => {
    const command = `END_CALL\n`;
    serialPort.write(command);
    res.send("Call Ended");
});

app.listen(port, () => console.log(`🚀 Server running on port ${port}`));