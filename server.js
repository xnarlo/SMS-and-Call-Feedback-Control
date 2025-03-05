const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const bodyParser = require("body-parser");
const { serialPort, parser } = require("./serial");

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

let smsStatus = null;
let latestMessageParts = 0;

parser.on("data", (data) => {
    const trimmedData = data.trim();
    console.log("📩 Received from Arduino:", trimmedData);

    if (trimmedData === "SMS_SENT" || trimmedData === "SMS_FAILED") {
        smsStatus = trimmedData;
        io.emit("sms_status", trimmedData);
    } else if (trimmedData === "CALL_STARTED" || trimmedData === "CALL_ENDED") {
        io.emit("call_status", trimmedData);
    }
});

// Function to wait for "SMS_SENT" or "SMS_FAILED"
const waitForSmsSent = async () => {
    return new Promise((resolve, reject) => {
        smsStatus = null;
        let timeout = setTimeout(() => reject(new Error("Timeout waiting for SMS_SENT")), 10000);

        let interval = setInterval(() => {
            if (smsStatus === "SMS_SENT") {
                clearTimeout(timeout);
                clearInterval(interval);
                resolve();
            } else if (smsStatus === "SMS_FAILED") {
                clearTimeout(timeout);
                clearInterval(interval);
                reject(new Error("SMS sending failed"));
            }
        }, 500);
    });
};

// ** Routes **

// Render SMS form
app.get("/sendsms", (req, res) => res.render("sendsms"));

// Render Call Client form
app.get("/callclient", (req, res) => res.render("callclient"));

// API to send total message parts count
app.get("/get-message-parts", (req, res) => {
    res.json({ totalParts: latestMessageParts });
});

// ** SMS Sending with Retries and Delays **
app.post("/send", async (req, res) => {
    const { number, message } = req.body;
    const maxPartLength = 150;
    const totalParts = Math.ceil(message.length / maxPartLength);
    latestMessageParts = totalParts;
    let failedParts = 0;

    try {
        for (let i = 0; i < totalParts; i++) {
            let partMessage = message.substring(i * maxPartLength, (i + 1) * maxPartLength);
            let partIndicator = `(${i + 1}/${totalParts})`;
            let fullMessage = `${partIndicator} ${partMessage}`;
            let command = `SEND_SMS,${number},${fullMessage}\n`;

            let attempts = 0;
            let sent = false;

            while (attempts < 3 && !sent) { // Retry up to 3 times
                console.log(`📤 Attempt ${attempts + 1}: Sending - ${fullMessage}`);
                serialPort.write(command);

                try {
                    await waitForSmsSent();
                    sent = true;
                } catch (error) {
                    attempts++;
                    console.log(`❌ Attempt ${attempts} failed for part ${partIndicator}. Retrying...`);
                }
            }

            if (!sent) {
                failedParts++;
            }

            // Small delay before sending the next part
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        if (failedParts === 0) {
            res.send("✅ All SMS parts sent successfully.");
        } else {
            res.status(500).send(`❌ Some messages failed. ${failedParts} parts were not sent.`);
        }
    } catch (error) {
        res.status(500).send(`❌ Error: ${error.message}`);
    }
});

// ** Call Handling **
app.post("/call", (req, res) => {
    const { number } = body.req;
    const command = `MAKE_CALL,${number}\n`;
    serialPort.write(command);
    res.send("📞 Call command sent");
});

app.post("/endcall", (req, res) => {
    const command = `END_CALL\n`;
    serialPort.write(command);
    res.send("📴 End Call command sent");
});

// Start server
server.listen(port, () => console.log(`🚀 Server running on port ${port}`));
