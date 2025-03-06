const express = require("express");
const router = express.Router();
const { serialPort } = require("../serial");

let latestMessageParts = 0;

// Function to wait for SMS response
const waitForSmsSent = async () => {
    return new Promise((resolve, reject) => {
        let smsStatus = null;
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

// Sanitize message to remove unsupported characters
const sanitizeMessage = (text) => {
    return text
        .replace(/’/g, "'")  // Replace smart quotes
        .replace(/“|”/g, '"')
        .replace(/—/g, "-")
        .replace(/[^\x20-\x7E]/g, ""); // Remove non-ASCII characters
};

// Render SMS form
router.get("/sendsms", (req, res) => res.render("sendsms"));

// API to get message parts
router.get("/get-message-parts", (req, res) => {
    res.json({ totalParts: latestMessageParts });
});

// Send SMS
router.post("/send", async (req, res) => {
    let { number, message } = req.body;
    const maxPartLength = 150;

    message = sanitizeMessage(message);

    if (message.length <= maxPartLength) {
        const command = `SEND_SMS,${number},${message}\n`;

        try {
            serialPort.write(command);
            await waitForSmsSent();
            return res.send("✅ SMS sent successfully.");
        } catch (error) {
            return res.status(500).send(`❌ Error: ${error.message}`);
        }
    }

    // Multi-part message logic
    const totalParts = Math.ceil(message.length / maxPartLength);
    latestMessageParts = totalParts;
    let failedParts = 0;

    try {
        for (let i = 0; i < totalParts; i++) {
            let partMessage = message.substring(i * maxPartLength, (i + 1) * maxPartLength);
            let fullMessage = `(${i + 1}/${totalParts}) ${partMessage}`;
            let command = `SEND_SMS,${number},${fullMessage}\n`;

            let attempts = 0;
            let sent = false;

            while (attempts < 3 && !sent) {
                serialPort.write(command);

                try {
                    await waitForSmsSent();
                    sent = true;
                } catch (error) {
                    attempts++;
                }
            }

            if (!sent) failedParts++;

            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        if (failedParts === 0) res.send("✅ All SMS parts sent successfully.");
        else res.status(500).send(`❌ Some messages failed. ${failedParts} parts were not sent.`);

    } catch (error) {
        res.status(500).send(`❌ Error: ${error.message}`);
    }
});

module.exports = router;
