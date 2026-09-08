const int greenLedPin = 9;
const int yellowLedPin = 10;
const int redLedPin = 11;
const int checkOutButtonPin = 2;

void setup() {
  pinMode(greenLedPin, OUTPUT);
  pinMode(yellowLedPin, OUTPUT);
  pinMode(redLedPin, OUTPUT);
  pinMode(checkOutButtonPin, INPUT_PULLUP);

  Serial.begin(9600);
  Serial.println("Tools Tracker Monitor Ready");
  setToolStatus("Available");
}

void loop() {
  if (Serial.available() > 0) {
    String command = Serial.readStringUntil('\n');
    command.trim();

    if (command.length() > 0) {
      setToolStatus(command);
    }
  }

  if (digitalRead(checkOutButtonPin) == LOW) {
    delay(150);
    if (digitalRead(checkOutButtonPin) == LOW) {
      setToolStatus("Checked Out");
      Serial.println("TOOL_CHECKED_OUT");
      delay(500);
    }
  }
}

void setToolStatus(String status) {
  digitalWrite(greenLedPin, LOW);
  digitalWrite(yellowLedPin, LOW);
  digitalWrite(redLedPin, LOW);

  if (status.equalsIgnoreCase("Available")) {
    digitalWrite(greenLedPin, HIGH);
  } else if (status.equalsIgnoreCase("Checked Out")) {
    digitalWrite(yellowLedPin, HIGH);
  } else if (status.equalsIgnoreCase("Maintenance")) {
    digitalWrite(redLedPin, HIGH);
  } else {
    digitalWrite(greenLedPin, HIGH);
    digitalWrite(yellowLedPin, HIGH);
    digitalWrite(redLedPin, HIGH);
  }

  Serial.print("Status: ");
  Serial.println(status);
}
