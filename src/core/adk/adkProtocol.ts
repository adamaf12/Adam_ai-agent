/**
 * Google ADK (Android Accessory Development Kit / AOA 2.0) Protocol Engine
 * Standard Open Accessory & Hardware Interface for ADEM AI
 */

export const ADK_PROTOCOL_VERSION = '2.0';

export enum AdkCommand {
  // Pin & GPIO Commands
  PIN_MODE = 0x01,
  DIGITAL_WRITE = 0x02,
  DIGITAL_READ = 0x03,
  ANALOG_WRITE = 0x04, // PWM
  ANALOG_READ = 0x05,  // ADC
  
  // Actuator & Servo Commands
  SERVO_ATTACH = 0x10,
  SERVO_WRITE = 0x11,
  SERVO_DETACH = 0x12,
  STEPPER_STEP = 0x13,
  ROBOT_DRIVE = 0x14,
  
  // Sensor & Telemetry Streaming
  SENSOR_ATTACH = 0x20,
  SENSOR_READ = 0x21,
  TELEMETRY_START = 0x22,
  TELEMETRY_STOP = 0x23,
  
  // System & Handshake
  PING = 0xF0,
  DEVICE_INFO = 0xF1,
  RESET = 0xFF,
}

export type PinMode = 'INPUT' | 'OUTPUT' | 'INPUT_PULLUP' | 'PWM' | 'SERVO' | 'ANALOG';

export interface AdkPinState {
  pin: number;
  label: string;
  mode: PinMode;
  value: number; // 0 or 1 for digital, 0-255 for PWM/Analog, 0-180 for Servo
  isPwmCapable?: boolean;
  isAnalogCapable?: boolean;
}

export interface AdkSensorData {
  id: string;
  name: string;
  unit: string;
  value: number;
  min: number;
  max: number;
  history: number[];
  color: string;
}

export interface AdkRobotState {
  motorLeftSpeed: number; // -255 to 255
  motorRightSpeed: number; // -255 to 255
  armBaseAngle: number; // 0 to 180
  armShoulderAngle: number; // 0 to 180
  armElbowAngle: number; // 0 to 180
  armGripperAngle: number; // 0 (closed) to 100 (open)
  ultrasonicDistanceCm: number;
  batteryMillivolts: number;
}

export interface GoogleAdkCardPayload {
  title: string;
  boardType: 'Arduino Mega ADK' | 'ESP32-S3 AOA' | 'Raspberry Pi Pico' | 'STM32 ADK' | 'Virtual ADK';
  connectionStatus?: 'connected' | 'simulated' | 'disconnected';
  baudRate?: number;
  pins?: AdkPinState[];
  sensors?: AdkSensorData[];
  robot?: AdkRobotState;
  sampleCode?: string;
  notes?: string;
}

export const DEFAULT_ADK_PINS: AdkPinState[] = [
  { pin: 2, label: 'D2 (PWM)', mode: 'PWM', value: 128, isPwmCapable: true },
  { pin: 3, label: 'D3 (LED)', mode: 'OUTPUT', value: 1, isPwmCapable: true },
  { pin: 4, label: 'D4 (Relay)', mode: 'OUTPUT', value: 0 },
  { pin: 5, label: 'D5 (Servo)', mode: 'SERVO', value: 90, isPwmCapable: true },
  { pin: 6, label: 'D6 (Buzzer)', mode: 'OUTPUT', value: 0, isPwmCapable: true },
  { pin: 7, label: 'D7 (Trigger)', mode: 'OUTPUT', value: 0 },
  { pin: 8, label: 'D8 (Echo)', mode: 'INPUT', value: 1 },
  { pin: 13, label: 'D13 (Builtin)', mode: 'OUTPUT', value: 1 },
];

export const DEFAULT_ADK_SENSORS: AdkSensorData[] = [
  { id: 'temp', name: 'Temperature', unit: '°C', value: 24.5, min: 0, max: 60, history: [24.1, 24.2, 24.4, 24.5, 24.5], color: '#f59e0b' },
  { id: 'light', name: 'Ambient Light (LDR)', unit: 'Lux', value: 680, min: 0, max: 1024, history: [650, 660, 670, 680], color: '#38bdf8' },
  { id: 'sonar', name: 'Sonar Distance', unit: 'cm', value: 42, min: 2, max: 400, history: [45, 44, 43, 42], color: '#10b981' },
  { id: 'gyro', name: 'Tilt / Gyro Angle', unit: '°', value: 12, min: -90, max: 90, history: [10, 11, 11, 12], color: '#a855f7' },
];

export const DEFAULT_ROBOT_STATE: AdkRobotState = {
  motorLeftSpeed: 0,
  motorRightSpeed: 0,
  armBaseAngle: 90,
  armShoulderAngle: 60,
  armElbowAngle: 110,
  armGripperAngle: 45,
  ultrasonicDistanceCm: 42,
  batteryMillivolts: 7420,
};
