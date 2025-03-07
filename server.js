const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const bodyParser = require("body-parser");
const { serialPort, parser } = require("./serial");
const smsRoutes = require("./routes/smsRoutes");
const callRoutes = require("./routes/callRoutes");
const loginRoute = require('./routes/login'); // Add login route

require("dotenv").config();

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const port = 3000;

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

serialPort.on("open", () => console.log("✅ Serial Port Opened"));
serialPort.on("error", (err) => console.error("❌ Serial Port Error:", err.message));

parser.on("data", (data) => {
    const trimmedData = data.trim();
    console.log("📩 Received from Arduino:", trimmedData);

    if (["SMS_SENT", "SMS_FAILED"].includes(trimmedData)) {
        io.emit("sms_status", trimmedData);
    } else if (["CALL_STARTED", "CALL_ENDED"].includes(trimmedData)) {
        io.emit("call_status", trimmedData);
    }
});

// Use modularized routes
app.use("/", smsRoutes);
app.use("/", callRoutes);
app.use('/', loginRoute); // Use login route

// Start server
server.listen(port, () => console.log(`🚀 Server running on port ${port}`));
