import React, { useState, useEffect, useRef } from 'react';
import {
  Cpu,
  Zap,
  Activity,
  Sliders,
  Play,
  RotateCw,
  Download,
  Copy,
  Check,
  Radio,
  Power,
  Compass,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type {
  GoogleAdkCardPayload,
  AdkPinState,
  AdkSensorData,
  AdkRobotState,
} from '../../core/adk/adkProtocol';
import {
  DEFAULT_ADK_PINS,
  DEFAULT_ADK_SENSORS,
  DEFAULT_ROBOT_STATE,
} from '../../core/adk/adkProtocol';
import {
  generateArduinoAdkFirmware,
  generateEsp32AdkFirmware,
} from '../../core/adk/firmwareGenerator';

interface GoogleAdkCardProps {
  data: GoogleAdkCardPayload;
  language: 'ar' | 'en';
}

export function GoogleAdkCard({ data, language }: GoogleAdkCardProps) {
  const isAr = language === 'ar';
  const [activeTab, setActiveTab] = useState<'pins' | 'sensors' | 'robot' | 'firmware'>('pins');
  const [pins, setPins] = useState<AdkPinState[]>(data.pins || DEFAULT_ADK_PINS);
  const [sensors, setSensors] = useState<AdkSensorData[]>(data.sensors || DEFAULT_ADK_SENSORS);
  const [robot, setRobot] = useState<AdkRobotState>(data.robot || DEFAULT_ROBOT_STATE);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isConnected, setIsConnected] = useState(data.connectionStatus === 'connected');
  const [activeBoard, setActiveBoard] = useState(data.boardType || 'Arduino Mega ADK');

  // Real-time sensor simulation telemetry oscillator
  useEffect(() => {
    const interval = setInterval(() => {
      setSensors(prevSensors =>
        prevSensors.map(sensor => {
          let delta = (Math.random() - 0.48) * (sensor.id === 'temp' ? 0.3 : 15);
          let newVal = Math.max(sensor.min, Math.min(sensor.max, Number((sensor.value + delta).toFixed(1))));
          const newHistory = [...sensor.history.slice(-14), newVal];
          return { ...sensor, value: newVal, history: newHistory };
        })
      );
    }, 800);

    return () => clearInterval(interval);
  }, []);

  const togglePin = (pinNum: number) => {
    setPins(prev =>
      prev.map(p => {
        if (p.pin === pinNum) {
          const newVal = p.value > 0 ? 0 : 1;
          return { ...p, value: newVal };
        }
        return p;
      })
    );
  };

  const updatePinValue = (pinNum: number, value: number) => {
    setPins(prev =>
      prev.map(p => (p.pin === pinNum ? { ...p, value } : p))
    );
  };

  const handleDriveRobot = (dir: 'fwd' | 'bwd' | 'left' | 'right' | 'stop') => {
    setRobot(prev => {
      switch (dir) {
        case 'fwd':
          return { ...prev, motorLeftSpeed: 200, motorRightSpeed: 200 };
        case 'bwd':
          return { ...prev, motorLeftSpeed: -200, motorRightSpeed: -200 };
        case 'left':
          return { ...prev, motorLeftSpeed: -150, motorRightSpeed: 150 };
        case 'right':
          return { ...prev, motorLeftSpeed: 150, motorRightSpeed: -150 };
        case 'stop':
        default:
          return { ...prev, motorLeftSpeed: 0, motorRightSpeed: 0 };
      }
    });
  };

  const firmwareCode = activeBoard.includes('ESP32')
    ? generateEsp32AdkFirmware()
    : generateArduinoAdkFirmware(pins.map(p => ({ pin: p.pin, mode: p.mode })));

  const handleCopyCode = () => {
    navigator.clipboard.writeText(firmwareCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div
      className="quick-liquid-glass rounded-2xl border border-[var(--border)] bg-slate-950/80 p-4 sm:p-5 shadow-2xl my-3 text-[var(--text)] transition-all overflow-hidden"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {/* Header with Google ADK Identity */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex-shrink-0">
            <Cpu size={20} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                <span>{data.title || (isAr ? 'محرك Google ADK للأجهزة والروبوتكس' : 'Google ADK Hardware Engine')}</span>
              </h4>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                AOA 2.0
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {activeBoard} • {isConnected ? (isAr ? 'متصل عبر USB AOA' : 'Connected via USB') : (isAr ? 'محاكي العتاد نشط' : 'Virtual Simulator Active')}
            </p>
          </div>
        </div>

        {/* Board & Connection Actions */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsConnected(!isConnected)}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
              isConnected
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
            }`}
          >
            <Radio size={12} className={isConnected ? 'animate-pulse' : ''} />
            <span>{isConnected ? (isAr ? 'متصل' : 'Online') : (isAr ? 'محاكاة' : 'Simulated')}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 pt-3 pb-3 overflow-x-auto scrollbar-none border-b border-[var(--border)]/50">
        <button
          type="button"
          onClick={() => setActiveTab('pins')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'pins'
              ? 'bg-[var(--accent)] text-slate-950 shadow-md'
              : 'bg-slate-900/60 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Zap size={13} />
          <span>{isAr ? 'المنافذ والـ GPIO' : 'Pins & GPIO'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('sensors')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'sensors'
              ? 'bg-[var(--accent)] text-slate-950 shadow-md'
              : 'bg-slate-900/60 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity size={13} />
          <span>{isAr ? 'حساسات التليمترية' : 'Sensors & Telemetry'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('robot')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'robot'
              ? 'bg-[var(--accent)] text-slate-950 shadow-md'
              : 'bg-slate-900/60 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Compass size={13} />
          <span>{isAr ? 'الروبوت والمحركات' : 'Robotics & Motors'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('firmware')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'firmware'
              ? 'bg-[var(--accent)] text-slate-950 shadow-md'
              : 'bg-slate-900/60 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers size={13} />
          <span>{isAr ? 'شفرة الفيرموير C++' : 'C++ Firmware'}</span>
        </button>
      </div>

      {/* Tab 1: Pins & GPIO Control */}
      {activeTab === 'pins' && (
        <div className="pt-3 space-y-2.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {pins.map(pin => (
              <div
                key={pin.pin}
                className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between gap-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-emerald-400">{pin.label}</span>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                      {pin.mode}
                    </span>
                  </div>

                  {pin.mode !== 'PWM' && pin.mode !== 'SERVO' && (
                    <button
                      type="button"
                      onClick={() => togglePin(pin.pin)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        pin.value > 0
                          ? 'bg-emerald-500 text-slate-950 shadow-md scale-105'
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                      }`}
                    >
                      {pin.value > 0 ? (isAr ? 'تشغيل HIGH' : 'ON (HIGH)') : (isAr ? 'إيقاف LOW' : 'OFF (LOW)')}
                    </button>
                  )}
                </div>

                {/* PWM Slider */}
                {pin.mode === 'PWM' && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                      <span>{isAr ? 'نبضة PWM:' : 'PWM Duty:'}</span>
                      <span className="text-emerald-300 font-bold">{pin.value} / 255</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={255}
                      value={pin.value}
                      onChange={e => updatePinValue(pin.pin, Number(e.target.value))}
                      className="w-full accent-emerald-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                    />
                  </div>
                )}

                {/* Servo Dial */}
                {pin.mode === 'SERVO' && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                      <span>{isAr ? 'زاوية السيرفو:' : 'Servo Angle:'}</span>
                      <span className="text-amber-300 font-bold">{pin.value}°</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={180}
                      value={pin.value}
                      onChange={e => updatePinValue(pin.pin, Number(e.target.value))}
                      className="w-full accent-amber-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Sensors & Telemetry Stream */}
      {activeTab === 'sensors' && (
        <div className="pt-3 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {sensors.map(sensor => (
              <div
                key={sensor.id}
                className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">{sensor.name}</span>
                  <span className="font-mono text-xs font-bold text-emerald-400">
                    {sensor.value} {sensor.unit}
                  </span>
                </div>

                {/* Mini Waveform Visualization */}
                <div className="h-10 flex items-end gap-1 bg-slate-950/60 p-1.5 rounded-lg border border-slate-800/80">
                  {sensor.history.map((val, idx) => {
                    const heightPercent = Math.max(
                      10,
                      Math.min(100, ((val - sensor.min) / (sensor.max - sensor.min || 1)) * 100)
                    );
                    return (
                      <div
                        key={idx}
                        className="flex-1 rounded-t-sm transition-all duration-300"
                        style={{
                          height: `${heightPercent}%`,
                          backgroundColor: sensor.color,
                          opacity: 0.3 + (idx / sensor.history.length) * 0.7,
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Robotics Arena & Actuator Control */}
      {activeTab === 'robot' && (
        <div className="pt-3 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Rover Motion D-Pad */}
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col items-center justify-center space-y-2">
              <span className="text-xs font-bold text-slate-300">{isAr ? 'تحكم حركة الروبوت (Rover D-Pad)' : 'Rover Motion D-Pad'}</span>
              
              <div className="flex flex-col items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleDriveRobot('fwd')}
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-emerald-600 active:scale-90 text-white font-bold text-xs transition-all cursor-pointer"
                  title="Forward"
                >
                  ▲ {isAr ? 'أمام' : 'FWD'}
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleDriveRobot('left')}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-emerald-600 active:scale-90 text-white font-bold text-xs transition-all cursor-pointer"
                    title="Left"
                  >
                    ◀ {isAr ? 'يسار' : 'LEFT'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDriveRobot('stop')}
                    className="p-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-90 text-white font-bold text-xs transition-all cursor-pointer"
                    title="Stop"
                  >
                    ■ {isAr ? 'توقف' : 'STOP'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDriveRobot('right')}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-emerald-600 active:scale-90 text-white font-bold text-xs transition-all cursor-pointer"
                    title="Right"
                  >
                    ▶ {isAr ? 'يمين' : 'RIGHT'}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => handleDriveRobot('bwd')}
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-emerald-600 active:scale-90 text-white font-bold text-xs transition-all cursor-pointer"
                  title="Backward"
                >
                  ▼ {isAr ? 'خلف' : 'REV'}
                </button>
              </div>
            </div>

            {/* Robotic Arm Angles */}
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-slate-300">{isAr ? 'مفاصل الذراع الآلي (Kinematic Arm)' : 'Kinematic Robotic Arm'}</span>
              
              <div className="space-y-2 font-mono text-[11px]">
                <div>
                  <div className="flex justify-between text-slate-400">
                    <span>{isAr ? 'قاعدة الذراع Base:' : 'Base Angle:'}</span>
                    <span className="text-emerald-400 font-bold">{robot.armBaseAngle}°</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={180}
                    value={robot.armBaseAngle}
                    onChange={e => setRobot({ ...robot, armBaseAngle: Number(e.target.value) })}
                    className="w-full accent-emerald-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-slate-400">
                    <span>{isAr ? 'الكتف Shoulder:' : 'Shoulder Angle:'}</span>
                    <span className="text-emerald-400 font-bold">{robot.armShoulderAngle}°</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={180}
                    value={robot.armShoulderAngle}
                    onChange={e => setRobot({ ...robot, armShoulderAngle: Number(e.target.value) })}
                    className="w-full accent-emerald-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-slate-400">
                    <span>{isAr ? 'المخلب Gripper:' : 'Gripper Aperture:'}</span>
                    <span className="text-amber-400 font-bold">{robot.armGripperAngle}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={robot.armGripperAngle}
                    onChange={e => setRobot({ ...robot, armGripperAngle: Number(e.target.value) })}
                    className="w-full accent-amber-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: C++ Firmware Source */}
      {activeTab === 'firmware' && (
        <div className="pt-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400">Google AOA 2.0 Firmware ({activeBoard})</span>
            <button
              type="button"
              onClick={handleCopyCode}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all cursor-pointer"
            >
              {copiedCode ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
              <span>{copiedCode ? (isAr ? 'تم النسخ!' : 'Copied!') : (isAr ? 'نسخ الكود' : 'Copy Code')}</span>
            </button>
          </div>

          <pre className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 font-mono text-[11px] text-emerald-300 max-h-56 overflow-y-auto scrollbar-thin text-start" dir="ltr">
            <code>{firmwareCode}</code>
          </pre>
        </div>
      )}

      {data.notes && (
        <div className="mt-3 pt-2 border-t border-[var(--border)]/40 text-[11px] text-slate-400 leading-relaxed">
          {data.notes}
        </div>
      )}
    </div>
  );
}
