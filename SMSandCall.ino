void setup() {
    Serial.begin(115200);   // Serial communication with PC
    Serial1.begin(9600);    // Serial1 for GSM module
    Serial.println("✅ Arduino Ready!");
}

void loop() {
    if (Serial.available()) {
        String receivedData = Serial.readStringUntil('\n');
        receivedData.trim();

        if (receivedData.startsWith("SEND_SMS")) {
            sendSMS(receivedData);
        } else if (receivedData.startsWith("MAKE_CALL")) {
            makeCall(receivedData);
        } else if (receivedData.startsWith("END_CALL")) {
            endCall();
        }
    }
}

void sendSMS(String command) {
    int firstComma = command.indexOf(',');
    int secondComma = command.indexOf(',', firstComma + 1);
    String number = command.substring(firstComma + 1, secondComma);
    String message = command.substring(secondComma + 1);

    Serial1.println("AT+CMGS=\"" + number + "\"");
    delay(100);
    Serial1.println(message);
    Serial1.write(26); // CTRL+Z to send SMS
}

void makeCall(String command) {
    String number = command.substring(command.indexOf(',') + 1);
    Serial1.println("ATD" + number + ";");
}

void endCall() {
    Serial1.println("ATH");
}
