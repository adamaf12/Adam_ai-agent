import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Zap,
  Activity,
  Compass,
  Layers,
  Radio,
  Download,
  Copy,
  Check,
  RefreshCw,
  Sliders,
  Play,
  Pause,
  SlidersHorizontal,
  Bot,
  Sparkles,
  Terminal,
} from 'lucide-react';
import type { Language } from '../../core/domain';
import {
  DEFAULT_ADK_PINS,
  DEFAULT_ADK_SENSORS,
  DEFAULT_ROBOT_STATE,
  type AdkPinState,
  type AdkSensorData,
  type AdkRobotState,
} from '../../core/adk/adkProtocol';
import {
  generateArduinoAdkFirmware,
  generateEsp32AdkFirmware,
} from '../../core/adk/firmwareGenerator';

interface GoogleAdkStudioProps {
  language: Language;
  onNavigateToChat?: (prompt: string) => void;
}

export function GoogleAdkStudio({ language, onNavigateToChat }: GoogleAdkStudioProps) {
  const isAr = language === 'ar';
  const [activeBoard, setActiveBoard] = useState<'Arduino Mega ADK' | 'ESP32-S3 AOA' | 'Raspberry Pi Pico'>('Arduino Mega ADK');
  const [connectionMode, setConnectionMode] = useState<'virtual' | 'webusb' | 'webserial' | 'bluetooth'>('virtual');
  const [pins, setPins] = useState<AdkPinState[]>(DEFAULT_ADK_PINS);
  const [sensors, setSensors] = useState<AdkSensorData[]>(DEFAULT_ADK_SENSORS);
  const [robot, setRobot] = useState<AdkRobotState>(DEFAULT_ROBOT_STATE);
  const [isLiveStreaming, setIsLiveStreaming] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    '[Google ADK] Subsystem initialized. Protocol AOA 2.0 ready.',
    '[ADEM Hardware Bridge] WebUSB / Serial transport available.',
    '[Virtual Simulator] Hardware registers clocked at 16MHz.',
  ]);

  // Telemetry loop
  useEffect(() => {
    if (!isLiveStreaming) return;
    const timer = setInterval(() => {
      setSensors(prev =>
        prev.map(s => {
          const delta = (Math.random() - 0.49) * (s.id === 'temp' ? 0.4 : 12);
          const newVal = Math.max(s.min, Math.min(s.max, Number((s.value + delta).toFixed(1))));
          return {
            ...s,
            value: newVal,
            history: [...s.history.slice(-19), newVal],
          };
        })
      );
    }, 600);

    return () => clearInterval(timer);
  }, [isLiveStreaming]);

  const togglePin = (pinNum: number) => {
    setPins(prev =>
      prev.map(p => {
        if (p.pin === pinNum) {
          const nextVal = p.value > 0 ? 0 : 1;
          setTerminalLogs(logs => [
            `[GPIO] Pin ${p.label} written to ${nextVal ? 'HIGH (1)' : 'LOW (0)'}`,
            ...logs.slice(0, 15),
          ]);
          return { ...p, value: nextVal };
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
      let l = 0;
      let r = 0;
      if (dir === 'fwd') { l = 220; r = 220; }
      else if (dir === 'bwd') { l = -220; r = -220; }
      else if (dir === 'left') { l = -180; r = 180; }
      else if (dir === 'right') { l = 180; r = -180; }
      
      setTerminalLogs(logs => [
        `[Robotics] Rover drive command: ${dir.toUpperCase()} (L:${l}, R:${r})`,
        ...logs.slice(0, 15),
      ]);
      return { ...prev, motorLeftSpeed: l, motorRightSpeed: r };
    });
  };

  const firmware = activeBoard === 'ESP32-S3 AOA'
    ? generateEsp32AdkFirmware()
    : generateArduinoAdkFirmware(pins.map(p => ({ pin: p.pin, mode: p.mode })));

  const handleCopyFirmware = () => {
    navigator.clipboard.writeText(firmware);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <section className="feature-page max-w-6xl mx-auto pb-28 animate-fadeIn pt-2" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="space-y-6">
        {/* Hero Header */}
        <div className="quick-liquid-glass p-6 rounded-3xl border border-[var(--border)] bg-[var(--surface)] backdrop-blur-xl shadow-2xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="p-3 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <Cpu size={28} className="animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-bold text-[var(--text)]">
                    {isAr ? 'استوديو Google ADK للأجهزة والروبوتات الذكية' : 'Google ADK Hardware & Robotics Studio'}
                  </h2>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    AOA 2.0 Engine
                  </span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  {isAr
                    ? 'تحكم حقيقي بمنافذ الـ GPIO، حساسات التليمترية اللحظية، محركات الروبوت، وتوليد شفرات C++ لـ Arduino و ESP32.'
                    : 'Real-time GPIO control, live sensor telemetry, robotics actuators, and production C++ firmware generation.'}
                </p>
              </div>
            </div>

            {/* Quick Ask AI button */}
            {onNavigateToChat && (
              <button
                type="button"
                onClick={() =>
                  onNavigateToChat(
                    isAr
                      ? 'اريد التحكم في بوردة Google ADK وربط حساسات وقيادة روبوت'
                      : 'I want to control a Google ADK accessory board, read telemetry sensors, and control robotics.'
                  )
                }
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold bg-[var(--accent)] text-slate-950 hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-md"
              >
                <Sparkles size={14} />
                <span>{isAr ? 'طلب مساعدة ذكية للعتاد' : 'AI Hardware Assistant'}</span>
              </button>
            )}
          </div>

          {/* Board Selector Bar */}
          <div className="mt-5 pt-4 border-t border-[var(--border)]/60 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400">{isAr ? 'اللوحة المستهدفة:' : 'Target Board:'}</span>
              {(['Arduino Mega ADK', 'ESP32-S3 AOA', 'Raspberry Pi Pico'] as const).map(board => (
                <button
                  key={board}
                  type="button"
                  onClick={() => setActiveBoard(board)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    activeBoard === board
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md'
                      : 'bg-slate-900/60 text-slate-300 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  {board}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsLiveStreaming(!isLiveStreaming)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900/80 text-slate-200 border border-slate-800 hover:bg-slate-800 transition-all cursor-pointer"
              >
                {isLiveStreaming ? <Pause size={13} className="text-amber-400" /> : <Play size={13} className="text-emerald-400" />}
                <span>{isLiveStreaming ? (isAr ? 'إيقاف البث' : 'Pause Stream') : (isAr ? 'تشغيل البث' : 'Resume Stream')}</span>
              </button>
            </div>
          </div>
        </div>

        {/* 3 Main Grid Panels: GPIO, Sensors, Robotics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Panel 1: GPIO Control */}
          <div className="quick-liquid-glass p-5 rounded-3xl border border-[var(--border)] bg-[var(--surface)] space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <Zap size={16} className="text-amber-400" />
                <h3 className="text-sm font-bold text-[var(--text)]">{isAr ? 'متحكم المنافذ (GPIO Matrix)' : 'GPIO Matrix'}</h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400">{pins.length} Pins Active</span>
            </div>

            <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1 scrollbar-thin">
              {pins.map(pin => (
                <div
                  key={pin.pin}
                  className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-emerald-400">{pin.label}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                        {pin.mode}
                      </span>
                    </div>

                    {pin.mode !== 'PWM' && pin.mode !== 'SERVO' && (
                      <button
                        type="button"
                        onClick={() => togglePin(pin.pin)}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          pin.value > 0
                            ? 'bg-emerald-500 text-slate-950 shadow-md scale-105'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                        }`}
                      >
                        {pin.value > 0 ? 'HIGH (1)' : 'LOW (0)'}
                      </button>
                    )}
                  </div>

                  {pin.mode === 'PWM' && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                        <span>PWM Duty:</span>
                        <span className="text-emerald-400 font-bold">{pin.value} / 255</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={255}
                        value={pin.value}
                        onChange={e => updatePinValue(pin.pin, Number(e.target.value))}
                        className="w-full accent-emerald-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                      />
                    </div>
                  )}

                  {pin.mode === 'SERVO' && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                        <span>Servo Angle:</span>
                        <span className="text-amber-400 font-bold">{pin.value}°</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={180}
                        value={pin.value}
                        onChange={e => updatePinValue(pin.pin, Number(e.target.value))}
                        className="w-full accent-amber-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Panel 2: Live Telemetry Oscilloscope */}
          <div className="quick-liquid-glass p-5 rounded-3xl border border-[var(--border)] bg-[var(--surface)] space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <Activity size={16} className="text-emerald-400" />
                <h3 className="text-sm font-bold text-[var(--text)]">{isAr ? 'تليمترية الحساسات المباشرة' : 'Live Telemetry'}</h3>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 animate-pulse">● STREAMING</span>
            </div>

            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1 scrollbar-thin">
              {sensors.map(sensor => (
                <div
                  key={sensor.id}
                  className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200">{sensor.name}</span>
                    <span className="font-mono text-xs font-bold text-emerald-400">
                      {sensor.value} {sensor.unit}
                    </span>
                  </div>

                  <div className="h-12 flex items-end gap-1 bg-slate-900/60 p-1.5 rounded-xl border border-slate-800/80">
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
                            opacity: 0.2 + (idx / sensor.history.length) * 0.8,
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Panel 3: Robotics Arena */}
          <div className="quick-liquid-glass p-5 rounded-3xl border border-[var(--border)] bg-[var(--surface)] space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <Compass size={16} className="text-cyan-400" />
                <h3 className="text-sm font-bold text-[var(--text)]">{isAr ? 'الروبوت والذراع الميكانيكي' : 'Robotics Arena'}</h3>
              </div>
              <span className="text-[10px] font-mono text-cyan-300">Dual Motor + 4-DOF</span>
            </div>

            <div className="space-y-4">
              {/* Rover D-Pad */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex flex-col items-center justify-center space-y-2">
                <span className="text-xs font-bold text-slate-300">Rover Motion D-Pad</span>
                <div className="flex flex-col items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleDriveRobot('fwd')}
                    className="p-2.5 px-4 rounded-xl bg-slate-800 hover:bg-emerald-600 active:scale-90 text-white font-bold text-xs transition-all cursor-pointer"
                  >
                    ▲ Forward
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleDriveRobot('left')}
                      className="p-2.5 px-3.5 rounded-xl bg-slate-800 hover:bg-emerald-600 active:scale-90 text-white font-bold text-xs transition-all cursor-pointer"
                    >
                      ◀ Left
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDriveRobot('stop')}
                      className="p-2.5 px-3.5 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-90 text-white font-bold text-xs transition-all cursor-pointer"
                    >
                      ■ STOP
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDriveRobot('right')}
                      className="p-2.5 px-3.5 rounded-xl bg-slate-800 hover:bg-emerald-600 active:scale-90 text-white font-bold text-xs transition-all cursor-pointer"
                    >
                      ▶ Right
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDriveRobot('bwd')}
                    className="p-2.5 px-4 rounded-xl bg-slate-800 hover:bg-emerald-600 active:scale-90 text-white font-bold text-xs transition-all cursor-pointer"
                  >
                    ▼ Reverse
                  </button>
                </div>
              </div>

              {/* Kinematic Arm Sliders */}
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-2 font-mono text-xs">
                <div>
                  <div className="flex justify-between text-slate-400">
                    <span>Arm Base:</span>
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
                    <span>Claw Gripper:</span>
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

        {/* Bottom Section: C++ Firmware Generator & ADK Console Logs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* C++ Code */}
          <div className="quick-liquid-glass p-5 rounded-3xl border border-[var(--border)] bg-[var(--surface)] space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <Layers size={16} className="text-indigo-400" />
                <h3 className="text-sm font-bold text-[var(--text)]">Google AOA 2.0 C++ Firmware</h3>
              </div>
              <button
                type="button"
                onClick={handleCopyFirmware}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-slate-900 text-slate-200 hover:bg-slate-800 transition-all cursor-pointer"
              >
                {copiedCode ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                <span>{copiedCode ? (isAr ? 'تم النسخ' : 'Copied') : (isAr ? 'نسخ الشفرة' : 'Copy Code')}</span>
              </button>
            </div>
            <pre className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 font-mono text-[11px] text-emerald-300 max-h-56 overflow-y-auto scrollbar-thin text-start" dir="ltr">
              <code>{firmware}</code>
            </pre>
          </div>

          {/* Terminal Console */}
          <div className="quick-liquid-glass p-5 rounded-3xl border border-[var(--border)] bg-[var(--surface)] space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <Terminal size={16} className="text-emerald-400" />
                <h3 className="text-sm font-bold text-[var(--text)]">{isAr ? 'سجل أحداث Google ADK' : 'ADK Event Logs'}</h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400">Live Serial 115200</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 font-mono text-[11px] text-slate-300 max-h-56 overflow-y-auto scrollbar-thin space-y-1 text-start" dir="ltr">
              {terminalLogs.map((log, index) => (
                <div key={index} className="leading-relaxed">
                  <span className="text-slate-500">[{new Date().toLocaleTimeString()}]</span> {log}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
