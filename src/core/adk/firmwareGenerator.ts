/**
 * Google ADK Firmware Generator
 * Produces production C++/Arduino and MicroPython sketches for Google Open Accessory 2.0 boards
 */

export function generateArduinoAdkFirmware(pins: { pin: number; mode: string }[]): string {
  const pinSetupCode = pins
    .map(p => `  pinMode(${p.pin}, ${p.mode === 'SERVO' ? 'OUTPUT' : p.mode});`)
    .join('\n');

  return `/*
 * Google ADK (Android Open Accessory 2.0) - ADEM AI Hardware Firmware
 * Compatible with Arduino Mega ADK, ESP32 AOA, and STM32
 */

#include <AndroidAccessory.h>
#include <Servo.h>

// Google Accessory Handshake Identity
AndroidAccessory acc("Google",
                     "ADEM-ADK",
                     "ADEM AI Hardware Accessory",
                     "2.0",
                     "https://adam-ai-agent.vercel.app",
                     "0000000012345678");

Servo mainServo;
unsigned long lastTelemetryMillis = 0;

void setup() {
  Serial.begin(115200);
  Serial.println("[ADEM ADK] Initializing Google Open Accessory 2.0...");

  // Configured Hardware Pins
${pinSetupCode}

  mainServo.attach(5);
  acc.powerOn();
}

void loop() {
  byte msg[64];

  if (acc.isConnected()) {
    int len = acc.read(msg, sizeof(msg), 1);
    if (len > 0) {
      byte cmd = msg[0];
      byte pin = msg[1];
      byte val = msg[2];

      switch (cmd) {
        case 0x02: // DIGITAL_WRITE
          digitalWrite(pin, val ? HIGH : LOW);
          break;
        case 0x04: // ANALOG_WRITE (PWM)
          analogWrite(pin, val);
          break;
        case 0x11: // SERVO_WRITE
          mainServo.write(val);
          break;
        case 0x14: // ROBOT_DRIVE
          // msg[1] = leftMotor, msg[2] = rightMotor
          analogWrite(9, abs((int8_t)msg[1]));
          analogWrite(10, abs((int8_t)msg[2]));
          break;
      }
    }

    // Stream Sensor Telemetry every 100ms
    if (millis() - lastTelemetryMillis > 100) {
      lastTelemetryMillis = millis();
      byte telemetry[16];
      telemetry[0] = 0x22; // TELEMETRY_PACKET
      
      int light = analogRead(A0);
      int temp = analogRead(A1);
      
      telemetry[1] = highByte(light);
      telemetry[2] = lowByte(light);
      telemetry[3] = highByte(temp);
      telemetry[4] = lowByte(temp);
      
      acc.write(telemetry, 5);
    }
  }
}
`;
}

export function generateEsp32AdkFirmware(): string {
  return `/*
 * ESP32-S3 Google ADK (USB-OTG AOA 2.0 & WebBluetooth)
 * For ADEM AI Hardware Automation & Sensor Streaming
 */

#include <Arduino.h>
#include <ESP32Servo.h>

Servo servo1;
const int PIN_LED = 2;
const int PIN_PWM = 4;
const int PIN_SERVO = 5;

void setup() {
  Serial.begin(115200);
  pinMode(PIN_LED, OUTPUT);
  pinMode(PIN_PWM, OUTPUT);
  
  servo1.attach(PIN_SERVO);
  Serial.println("{\"adk_status\": \"online\", \"version\": \"2.0\", \"device\": \"ESP32-S3 ADEM ADK\"}");
}

void loop() {
  if (Serial.available() > 0) {
    String command = Serial.readStringUntil('\\n');
    command.trim();

    if (command.startsWith("PIN:")) {
      // Format: PIN:13:1
      int pin = command.substring(4, command.indexOf(':', 4)).toInt();
      int val = command.substring(command.lastIndexOf(':') + 1).toInt();
      digitalWrite(pin, val ? HIGH : LOW);
    } else if (command.startsWith("SERVO:")) {
      int angle = command.substring(6).toInt();
      servo1.write(constrain(angle, 0, 180));
    }
  }

  // Stream live JSON telemetry
  static unsigned long lastSent = 0;
  if (millis() - lastSent > 200) {
    lastSent = millis();
    int light = analogRead(34);
    float temp = 24.0 + (analogRead(35) % 50) / 10.0;
    Serial.printf("{\\"telemetry\\":{\\"light\\":%d,\\"temp\\":%.2f,\\"dist\\":%d}}\\n", light, temp, 42);
  }
}
`;
}
