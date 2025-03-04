const express = require("express");
const bodyParser = require("body-parser");
const { SerialPort } = require("serialport");
const { ReadlineParser } = require("@serialport/parser-readline");

const app = express();
const port = 3000;

// Set up EJS for rendering views
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));

// Initialize SerialPort for COM3 (Check Device Manager for actual COM port)
const serialPort = new SerialPort({ path: "COM3", baudRate: 115200 });
const parser = serialPort.pipe(new ReadlineParser({ delimiter: "\n" }));

// Debug: Log serial connection status
serialPort.on("open", () => console.log("✅ Serial Port (COM3) Opened"));
serialPort.on("error", (err) => console.error("❌ Serial Port Error:", err));

// Route to search form
app.get("/search", (req, res) => {
    res.render("search");
});

// Route to handle SMS composition
app.post("/sendsms", (req, res) => {
    const { number, message } = req.body;

    console.log(`📩 Composing SMS - Number: ${number}, Message: ${message}`);
    res.render("sendsms", { number, message });
});

// Route to send SMS
app.post("/send", (req, res) => {
    const { number, message } = req.body;

    console.log(`📡 Sending SMS - Number: ${number}, Message: ${message}`);

    // Send data to Arduino via Serial
    serialPort.write(`SEND_SMS,${number},${message}\n`, (err) => {
        if (err) {
            console.error("❌ Error writing to serial:", err);
        } else {
            console.log("✅ Data sent to Arduino.");
        }
    });

    res.send("SMS Sent!");
});

// Route for call handling
app.get("/callclient", (req, res) => {
    res.render("callclient");
});

// Route to initiate a call
app.post("/call", (req, res) => {
    const { number } = req.body;

    console.log(`📞 Initiating Call - Number: ${number}`);

    serialPort.write(`CALL,${number}\n`, (err) => {
        if (err) console.error("❌ Error writing call command:", err);
    });

    res.send("Calling...");
});

// Route to drop a call
app.post("/drop", (req, res) => {
    console.log("📴 Dropping Call");

    serialPort.write("DROP_CALL\n", (err) => {
        if (err) console.error("❌ Error sending drop command:", err);
    });

    res.send("Call Dropped");
});

// Debug: Read Serial responses from Arduino
parser.on("data", (data) => {
    console.log(`🔄 Arduino Response: ${data.trim()}`);
});

// Start Express server
app.listen(port, () => {
    console.log(`🚀 Server running at http://localhost:${port}`);
});
