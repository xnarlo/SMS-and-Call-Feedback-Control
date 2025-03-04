void setup() {
    Serial.begin(115200);   // Serial for communication with PC (debugging)
    Serial1.begin(9600);    // Serial1 for GSM module communication

    Serial.println("✅ Arduino Ready!");
    delay(1000);
}

void loop() {
    if (Serial.available()) {
        String receivedData = Serial.readStringUntil('\n'); // Read incoming data from web app
        receivedData.trim(); // Remove trailing newline or spaces
        
        if (receivedData.startsWith("SEND_SMS")) {
            Serial.println("🔄 Processing SMS Command...");

            // Parse the number and message
            int firstComma = receivedData.indexOf(',');
            int secondComma = receivedData.indexOf(',', firstComma + 1);

            if (firstComma == -1 || secondComma == -1) {
                Serial.println("❌ Invalid format received!");
                return;
            }

            String phoneNumber = receivedData.substring(firstComma + 1, secondComma);
            String message = receivedData.substring(secondComma + 1);

            Serial.println("📤 Sending SMS...");
            sendSMS(phoneNumber, message);
        }
    }
}

void sendSMS(String number, String message) {
    Serial.print("🔄 GSM Module: Sending SMS to ");
    Serial.println(number);

    Serial1.println("AT"); // Test if the module is responding
    delay(1000);
    Serial1.println("AT+CMGF=1"); // Set SMS mode to TEXT
    delay(1000);
    
    Serial1.print("AT+CMGS=\"");
    Serial1.print(number);
    Serial1.println("\"");
    delay(1000);
    
    Serial1.print(message); // Send the actual message
    delay(500);
    
    Serial1.write(26); // CTRL+Z to send the message
    delay(5000);

    Serial.println("✅ SMS Sent Successfully!");
}
