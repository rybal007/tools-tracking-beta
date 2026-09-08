# Arduino Starter for the Tools Tracking Project

This folder contains a simple Arduino sketch that represents the tool status with LEDs and a checkout button.

## Hardware

- Arduino Uno or Nano
- 3 LEDs:
  - Green = Available
  - Yellow = Checked Out
  - Red = Maintenance
- 1 push button
- 220 ohm resistors for each LED
- Wires and breadboard

## Pin Mapping

- Green LED -> pin 9
- Yellow LED -> pin 10
- Red LED -> pin 11
- Button -> pin 2

## Upload

1. Open the sketch in the Arduino IDE.
2. Select your board and port.
3. Click Upload.
4. Open the Serial Monitor at 9600 baud.

## Commands

You can send status strings from the Serial Monitor:

- Available
- Checked Out
- Maintenance

The sketch will update the LED status and print the selected state.
